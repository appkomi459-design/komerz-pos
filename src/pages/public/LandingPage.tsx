import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Boxes,
  ShieldCheck,
  CreditCard,
  Building2,
  Sparkles,
  ShoppingBag,
  Laptop,
  Smartphone,
  Tablet,
  Check,
  ShoppingCart,
  Shirt,
  Wrench,
  Pill,
  BookOpen,
  Coffee,
  Briefcase,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { InteractiveSystemShowcase } from '@/components/common/InteractiveSystemShowcase';
import { BusinessAdaptiveShowcase } from '@/components/common/BusinessAdaptiveShowcase';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Store,
      title: 'Punto de Venta Ultra Rápido',
      description: 'Diseñado para cobrar en segundos con teclado, lector de código de barras o pantallas táctiles.',
    },
    {
      icon: Boxes,
      title: 'Inventario Inteligente',
      description: 'Control de existencias en tiempo real, alertas de stock bajo y actualización automática con cada venta.',
    },
    {
      icon: Building2,
      title: 'Múltiples Sucursales y Cajas',
      description: 'Gestiona varias tiendas físicas o almacenes con transferencias y arqueos de caja transparentes.',
    },
    {
      icon: ShieldCheck,
      title: 'Seguridad Multi-Tenant RLS',
      description: 'Tus datos están blindados a nivel de base de datos con aislamiento garantizado por empresa.',
    },
    {
      icon: TrendingUp,
      title: 'Reportes y Finanzas Claras',
      description: 'Ventas del día, productos más vendidos, ganancias netas y flujo de efectivo al instante.',
    },
    {
      icon: Smartphone,
      title: 'Acceso Multi-Dispositivo',
      description: 'Úsalo desde tu computadora, tablet o smartphone en cualquier navegador sin instalar programas pesados.',
    },
  ];

  const plans = [
    {
      name: 'Gratis / Prueba',
      price: '$0',
      period: 'por 14 días',
      description: 'Ideal para poner en marcha tu negocio y probar toda la plataforma.',
      features: [
        '1 Sucursal comercial',
        'Hasta 2 usuarios cajeros',
        'Catálogo de 100 productos',
        'Punto de venta ilimitado',
        'Reportes esenciales',
        'Soporte por correo',
      ],
      cta: 'Comenzar Gratis',
      popular: false,
    },
    {
      name: 'Profesional',
      price: '$29',
      period: 'mes / negocio',
      description: 'El plan preferido por negocios en crecimiento que demandan más potencia.',
      features: [
        'Hasta 3 sucursales activas',
        'Hasta 5 usuarios con roles',
        '2,000 productos y variantes',
        'Control avanzado de inventario',
        'Múltiples turnos de caja',
        'Exportación a Excel y PDF',
        'Soporte prioritario',
      ],
      cta: 'Elegir Profesional',
      popular: true,
    },
    {
      name: 'Empresarial',
      price: '$79',
      period: 'mes / negocio',
      description: 'Para cadenas comerciales y empresas con operaciones de gran volumen.',
      features: [
        'Hasta 10 sucursales',
        'Hasta 25 usuarios con permisos finos',
        'Productos y categorías ilimitadas',
        'Registro de auditoría completo',
        'API de integración y webhooks',
        'Soporte dedicado 24/7',
        'Capacitación inicial personalizada',
      ],
      cta: 'Contactar Ventas',
      popular: false,
    },
  ];

  const faqs = [
    {
      q: '¿Qué necesito para empezar a usar Komi POS?',
      a: 'Solo necesitas un dispositivo con conexión a internet (computadora, tablet o celular). Te registras gratis en 1 minuto, configuras el nombre de tu negocio y puedes comenzar a cargar tus productos y realizar ventas.',
    },
    {
      q: '¿Mis datos están seguros y separados de otros negocios?',
      a: 'Totalmente. Komi POS utiliza arquitectura multi-tenant con Row Level Security (RLS) en PostgreSQL. Cada consulta y operación está estrictamente aislada a nivel de servidor y base de datos.',
    },
    {
      q: '¿Puedo administrar más de una empresa o sucursal con la misma cuenta?',
      a: 'Sí. Puedes pertenecer a múltiples negocios y cambiar entre ellos con un solo clic desde tu panel sin necesidad de cerrar sesión o crear cuentas adicionales.',
    },
    {
      q: '¿Funciona con lectores de código de barra e impresoras térmicas?',
      a: 'Sí, es compatible con lectores USB y Bluetooth estándar, así como con la impresión de tickets en formatos estándar de 58mm y 80mm.',
    },
  ];

  return (
    <div className="space-y-28 pb-20 relative overflow-hidden bg-[#080c10]">
      {/* Background Aurora Mesh de fondo Esmeralda Nórdico & Titanio */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-emerald-600/12 rounded-full blur-[160px]" />
        <div className="absolute top-1/4 -right-32 w-[650px] h-[650px] bg-teal-600/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[600px] h-[600px] bg-emerald-950/30 rounded-full blur-[160px]" />
        <div className="absolute -bottom-20 right-1/4 w-[550px] h-[550px] bg-slate-800/20 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section con Fondos de Fotos de Negocios Reales */}
      <section className="relative pt-8 md:pt-16">
        {/* IMÁGENES DE NEGOCIOS REALES VISIBLES FLOTANTES */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Foto Tienda de Ropa / Moda (Izquierda) */}
          <div className="absolute top-2 left-2 sm:left-6 w-56 sm:w-80 h-48 sm:h-72 rounded-3xl overflow-hidden opacity-85 shadow-2xl rotate-[-3deg] border-2 border-emerald-500/30">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
              alt="Boutique y Tienda de Ropa"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080c10] via-transparent to-black/20" />
            <div className="absolute bottom-3 left-3 text-xs font-black text-white bg-slate-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/40 flex items-center gap-1.5 shadow-xl">
              <Shirt className="w-4 h-4 text-emerald-400" />
              <span>Tiendas de Ropa</span>
            </div>
          </div>

          {/* Foto Supermercado / Minimarket (Derecha) */}
          <div className="absolute top-2 right-2 sm:right-6 w-56 sm:w-80 h-48 sm:h-72 rounded-3xl overflow-hidden opacity-85 shadow-2xl rotate-[3deg] border-2 border-emerald-500/30">
            <img
              src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80"
              alt="Minimarket y Supermercado"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080c10] via-transparent to-black/20" />
            <div className="absolute bottom-3 right-3 text-xs font-black text-white bg-slate-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/40 flex items-center gap-1.5 shadow-xl">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Minimarkets</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-black tracking-wider uppercase mb-5 shadow-sm hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plataforma SaaS Cloud POS de Nueva Generación</span>
          </div>

          {/* TÍTULO BALANCEADO CON ESMERALDA NÓRDICO */}
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
            El Punto de Venta ágil que impulsa el crecimiento de tu{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Negocio
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            Cobra en segundos, mantén tu inventario sincronizado en tiempo real y ofrece a tus clientes un catálogo digital por QR.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>Crear mi Negocio Gratis</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-slate-700 hover:border-emerald-500/50 bg-slate-900/80 backdrop-blur-md text-slate-200 font-bold text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg">
                Ingresar a mi Cuenta
              </button>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sin tarjeta requerida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Prueba completa de 14 días</span>
            </div>
          </div>

          {/* DEMOSTRACIÓN VISUAL ANIMADA E INTERACTIVA DEL SISTEMA */}
          <InteractiveSystemShowcase />
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            Funcionalidades Profesionales
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Todo lo que necesitas para operar tu negocio
          </h2>
          <p className="mt-4 text-base text-slate-400 font-medium">
            Elimina cuadernos y sistemas lentos. Komerz POS une ventas, inventario, finanzas y clientes en una sola herramienta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative bg-slate-900/70 backdrop-blur-md rounded-3xl p-7 border border-slate-800/90 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300 shadow-md">
                  <Icon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal flex-1">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tipos de Negocios Compatibles - Simulador Adaptable Interactivo */}
      <section id="negocios" className="relative py-24 border-y border-slate-800/80 bg-[#0a0f14] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
              Versatilidad Total & Adaptabilidad en Vivo
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Mira exactamente cómo lucirá tu Negocio en Komerz POS
            </h2>
            <p className="mt-4 text-base text-slate-400 font-medium">
              Nuestro sistema no es una plantilla rígida: se adapta al rubro de tu comercio, mostrando sus tallas, lotes, báscula o comandas en tiempo real.
            </p>
          </div>

          {/* SIMULADOR ADAPTABLE EN VIVO PARA CADA NEGOCIO */}
          <BusinessAdaptiveShowcase />
        </div>
      </section>

      {/* Planes de suscripción */}
      <section id="planes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            Precios Claros y Transparentes
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Planes diseñados para cada etapa
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Comienza sin costo y escala tus recursos a medida que aumentan tus ventas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                p.popular
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-[#0c1410] border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 border border-slate-800 shadow-lg'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-lg shadow-emerald-500/30">
                    MÁS ELEGIDO
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-black text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>

                <div className="mt-6 mb-6 pb-6 border-b border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-xs text-slate-400 font-bold">{p.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {p.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 stroke-[2.5]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link to="/register">
                <button
                  className={`w-full py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                    p.popular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
                      : 'border-2 border-slate-700 hover:border-slate-500 text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {p.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas frecuentes (FAQ) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider mb-3">
            Resolvemos tus Dudas
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-200 hover:text-white cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openFaq === i ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {openFaq === i && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/80 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Final Esmeralda Ejecutivo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-3xl p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden border border-emerald-500/30">
          <div className="absolute inset-0 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Lleva tu negocio al siguiente nivel hoy mismo
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base">
              Únete a cientos de comerciantes que ahorran horas de trabajo cada semana con Komerz POS.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Registrarse Gratis</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
