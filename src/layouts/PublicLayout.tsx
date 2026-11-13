import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Moon, Sun, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { KomerzLogo } from '@/components/common/KomerzLogo';

export const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#080c10] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200 relative overflow-x-hidden">
      {/* Top Banner Esmeralda Nórdico Ejecutivo */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/20 text-emerald-300 text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
        <span>Komerz POS Cloud: Plataforma Multi-Empresa de Alta Disponibilidad para tu Negocio.</span>
      </div>

      {/* Navbar Dark Glassmorphic con Acentos Esmeralda */}
      <header className="sticky top-0 z-40 bg-[#080c10]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/">
            <KomerzLogo size="md" />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#caracteristicas" className="hover:text-emerald-400 transition-colors">
              Características
            </a>
            <a href="#beneficios" className="hover:text-emerald-400 transition-colors">
              Beneficios
            </a>
            <a href="#negocios" className="hover:text-emerald-400 transition-colors">
              Tipos de Negocios
            </a>
            <a href="#planes" className="hover:text-emerald-400 transition-colors">
              Planes
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              Preguntas
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-400" />}
            </button>

            {user ? (
              <Link to="/app">
                <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                  Ir a mi Panel
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white font-bold text-xs hover:bg-slate-800/60 transition-all cursor-pointer">
                    Iniciar sesión
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer">
                    Registrarse
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer Dark Integrado */}
      <footer className="bg-[#080c10] border-t border-slate-800 py-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div>
                <KomerzLogo size="sm" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                La plataforma SaaS de Punto de Venta e Inventario diseñada para negocios independientes y cadenas comerciales modernas.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">
                Plataforma
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#caracteristicas" className="hover:text-emerald-400 transition-colors">Punto de Venta Ultra Rápido</a></li>
                <li><a href="#caracteristicas" className="hover:text-emerald-400 transition-colors">Inventario y Stock en Vivo</a></li>
                <li><a href="#caracteristicas" className="hover:text-emerald-400 transition-colors">Múltiples Sucursales</a></li>
                <li><a href="#planes" className="hover:text-emerald-400 transition-colors">Planes y Precios</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">
                Negocios
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#negocios" className="hover:text-emerald-400 transition-colors">Minimarkets y Alimentos</a></li>
                <li><a href="#negocios" className="hover:text-emerald-400 transition-colors">Tiendas de Ropa y Calzado</a></li>
                <li><a href="#negocios" className="hover:text-emerald-400 transition-colors">Ferreterías y Construcción</a></li>
                <li><a href="#negocios" className="hover:text-emerald-400 transition-colors">Farmacias y Carnicerías</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">
                Seguridad & Soporte
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Aislamiento RLS Multi-Tenant</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Infraestructura Cloud de Alta Disponibilidad</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-4">
                Soporte en línea: <span className="text-emerald-400 font-mono">soporte@komipos.com</span>
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Komerz POS SaaS. Todos los derechos reservados.</p>
            <p className="mt-2 sm:mt-0">Construido con tecnología de punta para comercio global.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
