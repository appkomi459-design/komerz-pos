import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  QrCode,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  CreditCard,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  Printer,
  FileText,
  Palette,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const InteractiveSystemShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'qr'>('pos');

  return (
    <div className="relative max-w-6xl mx-auto mt-16 px-4">
      {/* Pestañas animadas de navegación */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
            activeTab === 'pos'
              ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-xl shadow-indigo-600/35 scale-105 ring-2 ring-cyan-400/50'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-300 animate-pulse" />
          <span>1. Punto de Venta (Caja)</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-xl shadow-indigo-600/35 scale-105 ring-2 ring-cyan-400/50'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
          }`}
        >
          <Package className="w-4 h-4 text-amber-300" />
          <span>2. Control de Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-xl shadow-indigo-600/35 scale-105 ring-2 ring-cyan-400/50'
              : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
          }`}
        >
          <Printer className="w-4 h-4 text-emerald-300" />
          <span>3. Impresión Oficial & Factura</span>
        </button>
      </div>

      {/* Marco de demostración estilo pantalla interactiva de última generación */}
      <div className="relative rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 to-[#0b0f19] p-4 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden group">
        {/* Glow de fondo */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Cabecera de la ventana simulada */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">
              komerz-pos.cloud/{activeTab === 'pos' ? 'caja-express' : activeTab === 'inventory' ? 'stock-alertas' : 'catalogo-qr'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-black text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Modo En Vivo
            </span>
          </div>
        </div>

        {/* VISTA 1: PUNTO DE VENTA ULTRA RÁPIDO */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in text-left">
            {/* Lado izquierdo: Cuadrícula de productos de cobro rápido */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <Barcode className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-mono flex-1">
                  Escáner activo: apuntar lector o buscar por código...
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-black px-2 py-0.5 rounded border border-cyan-800">
                  F9 COBRO
                </span>
              </div>

              {/* Grid de productos con FOTOS REALES de alta calidad */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    name: 'Café Tostado Gourmet',
                    price: '$7.00',
                    cat: 'Bebidas',
                    stock: '12 uds',
                    img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=300&q=80',
                  },
                  {
                    name: 'Aceite de Oliva Extra',
                    price: '$8.50',
                    cat: 'Abarrotes',
                    stock: '30 uds',
                    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80',
                  },
                  {
                    name: 'Camisa Casual Slim',
                    price: '$24.00',
                    cat: 'Ropa',
                    stock: '15 uds',
                    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&q=80',
                  },
                  {
                    name: 'Zapatos Deportivos Pro',
                    price: '$55.00',
                    cat: 'Calzado',
                    stock: '8 uds',
                    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
                  },
                  {
                    name: 'Set Taladro Eléctrico',
                    price: '$45.00',
                    cat: 'Ferretería',
                    stock: '6 uds',
                    img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80',
                  },
                  {
                    name: 'Jugo Natural Naranja',
                    price: '$2.50',
                    cat: 'Bebidas',
                    stock: '24 uds',
                    img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=300&q=80',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/15 hover:-translate-y-1 transition-all duration-200 cursor-pointer group/card flex flex-col justify-between"
                  >
                    <div className="w-full h-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden mb-2 relative">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                      />
                      <span className="absolute top-1 right-1 text-[9px] font-black bg-slate-950/80 backdrop-blur-xs text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        {item.cat}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-emerald-400">{item.price}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{item.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lado derecho: Ticket de venta actual */}
            <div className="lg:col-span-5 bg-slate-950/90 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Ticket #0042</span>
                  <span className="text-xs text-cyan-400 font-black">Cliente General</span>
                </div>

                <div className="space-y-3 my-4 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">Café Tostado 500g</p>
                      <span className="text-[10px] text-slate-500">1 x $7.00</span>
                    </div>
                    <span className="font-black text-white">$7.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">Arroz Extra 10 lbs</p>
                      <span className="text-[10px] text-slate-500">2 x $9.50</span>
                    </div>
                    <span className="font-black text-white">$19.00</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400 font-bold">TOTAL A COBRAR:</span>
                  <span className="text-2xl font-black text-emerald-400">$26.00</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-black text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-800">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Tarjeta</span>
                  </button>
                  <button className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cobrar (F12)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: CONTROL DE STOCK Y ALERTAS */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-fade-in text-left">
            {/* Banner de alerta de stock bajo */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-bounce">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-300">¡Alerta de Inventario en Tiempo Real!</p>
                  <p className="text-[11px] text-slate-400">Hay 2 productos que llegaron a su límite mínimo recomendado.</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                2 Alertas activas
              </span>
            </div>

            {/* Tabla de inventario simulada */}
            <div className="bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-black text-[10px] uppercase">
                    <th className="py-3 px-4 text-left">Producto</th>
                    <th className="py-3 px-4 text-center">SKU</th>
                    <th className="py-3 px-4 text-center">Costo</th>
                    <th className="py-3 px-4 text-center">Precio Venta</th>
                    <th className="py-3 px-4 text-center">Existencias</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
                  <tr className="bg-amber-500/5">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/40 overflow-hidden flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=120&q=80"
                          alt="Café Gourmet"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-black text-white">Café Puro Tostado 500g</p>
                        <span className="text-[9px] text-amber-400 font-bold">STOCK CRÍTICO</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">PROD-3400</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-400">$4.50</td>
                    <td className="py-3 px-4 text-center font-black text-emerald-400">$7.00</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black text-[11px] animate-pulse inline-flex items-center gap-1">
                        3 UND ⚠️
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">ACTIVO</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=120&q=80"
                          alt="Camisa Casual"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-black text-white">Camisa Casual Slim L</p>
                        <span className="text-[9px] text-violet-400 font-bold">Ropa & Moda</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">PROD-5020</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-400">$12.00</td>
                    <td className="py-3 px-4 text-center font-black text-emerald-400">$24.00</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-black text-[10px]">
                        15 UND
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">ACTIVO</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=120&q=80"
                          alt="Zapatos Deportivos"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-black text-white">Zapatos Deportivos Pro 42</p>
                        <span className="text-[9px] text-cyan-400 font-bold">Calzado</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">PROD-9100</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-400">$28.00</td>
                    <td className="py-3 px-4 text-center font-black text-emerald-400">$55.00</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-black text-[10px]">
                        8 UND
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">ACTIVO</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA 3: HOJA DE IMPRESIÓN OFICIAL DEL CATÁLOGO / FACTURA */}
        {activeTab === 'qr' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Barra superior de controles del reporte */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/90 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Vista Previa de Impresión Oficial (PDF / Impresora)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Color activo:</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 shadow-sm" />
                  <span className="text-[11px] font-black text-white">Verde Esmeralda</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  1 Hoja de papel
                </span>
              </div>
            </div>

            {/* Simulación exacta del Documento Impreso Oficial (A4) */}
            <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border-4 border-slate-800/60 overflow-hidden font-sans">
              {/* ENCABEZADO CON COLOR SELECCIONADO Y LOGO DEL NEGOCIO */}
              <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shadow-md mb-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border-2 border-white/40 flex items-center justify-center text-white font-black text-xl shadow-inner">
                    M
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">
                      CATÁLOGO OFICIAL · INVENTARIO Y PRODUCTOS
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                      Minimarket Don Juan
                    </h2>
                    <p className="text-[10px] text-emerald-100">
                      Reporte de Inventario, Precios y Existencias en Tienda
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white font-black text-xs border border-white/30">
                    4 ARTÍCULOS
                  </span>
                  <p className="text-[10px] text-emerald-100 mt-2 font-mono">
                    11/11/2026 20:30
                  </p>
                </div>
              </div>

              {/* Franja de información del catálogo */}
              <div className="flex justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] text-slate-600 mb-4">
                <div>
                  <span className="font-black text-slate-800">INFORMACIÓN DEL CATÁLOGO</span><br />
                  Filtro: <strong>Catálogo Completo</strong> | Moneda: <strong>Dólares (USD)</strong>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-800">DATOS DE AUDITORÍA</span><br />
                  Ubicación: <strong>Santiago</strong> | Estado: <strong className="text-emerald-600 font-bold">Conectado a Komerz POS ✓</strong>
                </div>
              </div>

              {/* TABLA DE PRODUCTOS EN ALTO CONTRASTE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Categoría</th>
                      <th className="py-2.5 px-3 text-center">Código / SKU</th>
                      <th className="py-2.5 px-3 text-center">Costo</th>
                      <th className="py-2.5 px-3 text-center">Precio Venta</th>
                      <th className="py-2.5 px-3 text-center">Stock</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800 text-[11px]">
                    <tr className="bg-amber-50/50">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px]">☕</div>
                        <div>
                          <p className="font-bold text-slate-900">Café Puro Tostado 500g</p>
                          <span className="text-[9px] text-rose-600 font-black">BAJO</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">Abarrotes y Alimentos</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[10px]">7401001003</td>
                      <td className="py-2.5 px-3 text-center">$4.50</td>
                      <td className="py-2.5 px-3 text-center font-black text-emerald-600">$7.00</td>
                      <td className="py-2.5 px-3 text-center text-rose-600 font-black">3 UND ⚠️</td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-black text-[10px]">ACTIVO</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px]">🌾</div>
                        <p className="font-bold text-slate-900">Arroz Selecto 10 lbs</p>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">Abarrotes y Alimentos</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[10px]">7401001001</td>
                      <td className="py-2.5 px-3 text-center">$6.00</td>
                      <td className="py-2.5 px-3 text-center font-black text-emerald-600">$9.50</td>
                      <td className="py-2.5 px-3 text-center font-black">45 UND</td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-black text-[10px]">ACTIVO</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px]">🫒</div>
                        <p className="font-bold text-slate-900">Aceite Vegetal 1 Litro</p>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">Abarrotes y Alimentos</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[10px]">7401001002</td>
                      <td className="py-2.5 px-3 text-center">$2.80</td>
                      <td className="py-2.5 px-3 text-center font-black text-emerald-600">$4.25</td>
                      <td className="py-2.5 px-3 text-center font-black">30 UND</td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-black text-[10px]">ACTIVO</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PIE DE PÁGINA CON QR NEGRO Y TOTALES */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {/* Bloque Izquierdo: Insignia de Certificación */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-800 text-white">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-black text-lg">
                    M
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-200">
                      CATÁLOGO OFICIAL CERTIFICADO
                    </span>
                    <p className="text-xs font-black">Minimarket Don Juan</p>
                    <span className="text-[9px] text-emerald-100">✓ Registro Oficial de Precios</span>
                  </div>
                </div>

                {/* BLOQUE CENTRAL: QR OFICIAL EN NEGRO */}
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <QRCodeSVG
                      value="https://komerz-pos.cloud/c/minimarket-don-juan"
                      size={64}
                      fgColor="#000000"
                      bgColor="#ffffff"
                      level="M"
                    />
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    📲 ESCANEAR CATÁLOGO
                  </span>
                </div>

                {/* Bloque Derecho: Totales de Valor de Venta */}
                <div className="text-right text-xs space-y-1">
                  <div className="flex justify-between gap-4 text-slate-500 text-[11px]">
                    <span>Artículos en catálogo:</span>
                    <strong className="text-slate-800">4 productos</strong>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-500 text-[11px]">
                    <span>Unidades en existencia:</span>
                    <strong className="text-slate-800">138 uds.</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-black text-xs mt-1">
                    <span>VALOR TOTAL VENTA:</span>
                    <span className="text-sm font-black">$ 693.00</span>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-center text-slate-400 mt-3">
                Catálogo y lista de precios emitido por el Sistema Komerz POS · Calidad y Precios Garantizados
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
