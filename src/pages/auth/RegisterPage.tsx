import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Por favor escribe tu nombre completo.');
      return;
    }

    if (!email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

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
      const { error: signUpError, user } = await signUp(email, password, fullName.trim());

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('Ya existe un usuario con este correo electrónico.');
        } else {
          setError(signUpError.message || 'Error al registrar el usuario.');
        }
        return;
      }

      if (user) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/onboarding');
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
          Crea tu Cuenta
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Comienza a digitalizar tu negocio en segundos
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
          <span>¡Cuenta creada con éxito! Redirigiendo a la configuración de tu negocio...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre y Apellido"
          type="text"
          placeholder="Ej. Juan Pérez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="Correo Electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@negocio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Input
          label="Confirmar Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Button
          type="submit"
          className="w-full mt-3"
          size="md"
          loading={loading}
          disabled={success}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Crear Cuenta y Continuar
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 text-center">
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
