import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * LoginPage — Inicio de sesión.
 *
 * La redirección post-login la maneja automáticamente PublicAuthRoute en AppRoutes.tsx:
 *   - is_super_admin → /superadmin
 *   - sin negocio      → /onboarding
 *   - con negocio      → /app
 *
 * Aquí sólo llamamos a signIn() y mostramos errores si los hay.
 */
export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  /** Rellena los campos con credenciales de demo */
  const fillCredentials = (type: 'admin' | 'usuario') => {
    setIdentifier(type === 'admin' ? 'admin' : 'usuario');
    setPassword(type === 'admin' ? 'Admin123*' : 'usuario123*');
    setError(null);
  };

  /** Convierte alias cortos al email real de Supabase */
  const resolveEmail = (raw: string): string => {
    const v = raw.trim().toLowerCase();
    if (v === 'admin')   return 'admin@komipos.com';
    if (v === 'usuario') return 'usuario@komipos.com';
    if (!v.includes('@')) return `${v}@komipos.com`;
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Por favor ingresa tu usuario/correo y contraseña.');
      return;
    }

    const email = resolveEmail(identifier);

    try {
      setLoading(true);
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        const msg = signInError.message ?? '';
        if (msg.includes('Invalid login credentials')) {
          setError('Credenciales incorrectas. Verifica tu usuario o contraseña.');
        } else if (msg.includes('Email not confirmed')) {
          setError('El correo electrónico aún no ha sido confirmado.');
        } else if (msg.toLowerCase().includes('database error')) {
          setError('Error de conexión temporal. Intenta nuevamente en unos segundos.');
        } else {
          setError(msg || 'Error al iniciar sesión. Intenta de nuevo.');
        }
        return;
      }

      // signIn exitoso → AuthContext actualiza sesión y perfil →
      // PublicAuthRoute detecta el cambio y redirige automáticamente.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al conectar.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Título */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
          Iniciar Sesión
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Ingresa a tu panel de administración comercial
        </p>
      </div>

      {/* Acceso rápido demo */}
      <div className="mb-5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Acceso Rápido de Prueba:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials('admin')}
            className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-left hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <p className="font-bold text-gray-900 dark:text-zinc-100">👑 Admin</p>
            <p className="text-[10px] text-gray-400">admin / Admin123*</p>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('usuario')}
            className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-left hover:border-emerald-500 transition-colors cursor-pointer"
          >
            <p className="font-bold text-gray-900 dark:text-zinc-100">👤 Usuario</p>
            <p className="text-[10px] text-gray-400">usuario / usuario123*</p>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Usuario o Correo"
          type="text"
          placeholder="admin o tu@correo.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          icon={<User className="w-4 h-4" />}
          required
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
              Contraseña
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="md"
          loading={loading}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Acceder al Sistema
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 text-center">
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          ¿Aún no tienes cuenta?{' '}
          <Link
            to="/register"
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};
