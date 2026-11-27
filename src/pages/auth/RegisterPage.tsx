import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const RegisterPage: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          rightIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          onRightIconClick={() => setShowPassword((v) => !v)}
          required
        />

        <Input
          label="Confirmar Contraseña"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          rightIcon={showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          onRightIconClick={() => setShowConfirmPassword((v) => !v)}
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

      <div className="mt-5">
        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-gray-200 dark:border-zinc-700 w-full" />
          <span className="absolute bg-white dark:bg-zinc-900 px-3 text-xs text-gray-400">o continúa con</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            setError(null);
            const { error: googleError } = await signInWithGoogle();
            if (googleError) setError('Error al registrarse con Google.');
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-gray-700 dark:text-zinc-200 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7H6.1C9.4 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C41.6 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          Continuar con Google
        </button>
      </div>

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
