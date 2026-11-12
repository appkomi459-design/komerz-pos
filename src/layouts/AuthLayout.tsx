import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { KomerzLogo } from '@/components/common/KomerzLogo';

export const AuthLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-emerald-50/20 to-gray-100 dark:from-[#0d0d0f] dark:via-[#111614] dark:to-[#0e0e10] text-gray-900 dark:text-zinc-100 transition-colors duration-200 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Top action bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors py-2 px-3 rounded-xl hover:bg-white/60 dark:hover:bg-zinc-800/60 backdrop-blur-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mt-6 flex flex-col items-center">
        <Link to="/" className="mb-2">
          <KomerzLogo size="lg" />
        </Link>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-semibold">
          Plataforma de Punto de Venta y Gestión Empresarial
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white/90 dark:bg-[#18181b]/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-xl shadow-gray-200/50 dark:shadow-none rounded-3xl border border-gray-100 dark:border-zinc-800/90 relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
