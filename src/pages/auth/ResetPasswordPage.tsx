import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError.message || 'Error al actualizar contraseña.');
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
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
          Nueva Contraseña
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Crea una nueva contraseña segura para tu cuenta
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
          <span>¡Contraseña actualizada con éxito! Redirigiendo al login...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nueva Contraseña"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Input
          label="Confirmar Contraseña"
          type="password"
          placeholder="Repite la nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2"
          size="md"
          loading={loading}
          disabled={success}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Guardar Contraseña
        </Button>
      </form>
    </div>
  );
};
