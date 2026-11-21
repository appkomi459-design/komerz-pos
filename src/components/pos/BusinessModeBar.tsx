import React from 'react';
import {
  Scale,
  UtensilsCrossed,
  Shirt,
  Pill,
  ShoppingBag,
  Wrench,
  Croissant,
  IceCream2,
  Store,
  Sparkles,
  Printer,
  Plus,
  Check,
} from 'lucide-react';
import type { BusinessType } from '@/types';

export interface BusinessModeBarProps {
  currentType: BusinessType | string;
  onTypeChange?: (newType: BusinessType) => void;
  // Butcher / Weight state
  selectedWeight: number | null;
  onSelectWeight: (weight: number | null) => void;
  onOpenScaleModal: () => void;
  // Restaurant state
  selectedTable: string;
  onSelectTable: (table: string) => void;
  onPrintKitchenOrder?: () => void;
  hasItemsInCart?: boolean;
  // Clothing state
  selectedSize: string | null;
  onSelectSize: (size: string | null) => void;
  selectedColor: string | null;
  onSelectColor: (color: string | null) => void;
  // Pharmacy / Category filter
  onQuickFilter?: (term: string) => void;
  // Hardware / Unit
  selectedUnit?: string;
  onSelectUnit?: (unit: string) => void;
  // Minimarket / Pack mode
  packDiscountActive?: boolean;
  onTogglePackDiscount?: () => void;
}

export const BUSINESS_CONFIGS: Record<
  string,
  {
    name: string;
    icon: React.ElementType;
    badgeColor: string;
    description: string;
  }
> = {
  butchery: {
    name: 'Carnicería / Frigorífico',
    icon: Scale,
    badgeColor: 'from-rose-500 to-red-600',
    description: 'Balanza electrónica, cortes por kilo y cálculo exacto de peso.',
  },
  restaurant: {
    name: 'Restaurante / Cafetería',
    icon: UtensilsCrossed,
    badgeColor: 'from-amber-500 to-orange-600',
    description: 'Control de mesas, salón, comandas a cocina y delivery.',
  },
  clothing: {
    name: 'Tienda de Ropa & Calzado',
    icon: Shirt,
    badgeColor: 'from-purple-500 to-indigo-600',
    description: 'Gestión por tallas, colores y variantes de prendas.',
  },
  pharmacy: {
    name: 'Farmacia / Droguería',
    icon: Pill,
    badgeColor: 'from-teal-500 to-emerald-600',
    description: 'Búsqueda por principio activo, control de lote y recetas.',
  },
  minimarket: {
    name: 'Minimarket / Supermercado',
    icon: ShoppingBag,
    badgeColor: 'from-blue-500 to-cyan-600',
    description: 'Escaneo de código de barras rápido y ventas por pack.',
  },
  hardware: {
    name: 'Ferretería / Construcción',
    icon: Wrench,
    badgeColor: 'from-amber-600 to-yellow-600',
    description: 'Venta fraccionada por metros, kilos, bolsas y mayorista.',
  },
  bakery: {
    name: 'Panadería / Pastelería',
    icon: Croissant,
    badgeColor: 'from-orange-500 to-amber-600',
    description: 'Ventas por pieza horneada o por peso en balanza.',
  },
  icecream: {
    name: 'Heladería / Gelatería',
    icon: IceCream2,
    badgeColor: 'from-pink-500 to-rose-500',
    description: 'Presentaciones en cono, vaso y selección de sabores.',
  },
  retail: {
    name: 'Comercio General / Retail',
    icon: Store,
    badgeColor: 'from-emerald-500 to-teal-600',
    description: 'Punto de venta versátil para todo tipo de productos.',
  },
};

export const BusinessModeBar: React.FC<BusinessModeBarProps> = ({
  currentType,
  selectedWeight,
  onSelectWeight,
  onOpenScaleModal,
  selectedTable,
  onSelectTable,
  onPrintKitchenOrder,
  hasItemsInCart = false,
  selectedSize,
  onSelectSize,
  selectedColor,
  onSelectColor,
  onQuickFilter,
  selectedUnit = 'UND',
  onSelectUnit,
  packDiscountActive = false,
  onTogglePackDiscount,
}) => {
  // Normalizar el tipo de negocio
  const normalizedType =
    currentType in BUSINESS_CONFIGS ? currentType : 'retail';
  const config = BUSINESS_CONFIGS[normalizedType] || BUSINESS_CONFIGS.retail;
  const IconComponent = config.icon;

  return (
    <div className="w-full bg-white dark:bg-[#181615] rounded-2xl border-2 border-slate-200 dark:border-zinc-800 p-3 shadow-sm space-y-2.5 transition-all">
      {/* Cabecera del Modo Activo */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl bg-gradient-to-br ${config.badgeColor} text-white flex items-center justify-center shadow-xs`}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                Modo {config.name}
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-md">
                Activo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
              {config.description}
            </p>
          </div>
        </div>

        {/* Botón especial para restaurante (Comanda) */}
        {normalizedType === 'restaurant' && onPrintKitchenOrder && (
          <button
            type="button"
            onClick={onPrintKitchenOrder}
            disabled={!hasItemsInCart}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              hasItemsInCart
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 active:scale-95'
                : 'bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
            }`}
            title="Imprimir ticket para cocineros (sin precios)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Comanda Cocina</span>
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CONTROLES ESPECÍFICOS SEGÚN EL RUBRO                          */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 1. CARNICERÍA / PANADERÍA: Selector de Peso y Balanza */}
      {(normalizedType === 'butchery' || normalizedType === 'bakery') && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
            <Scale className="w-3.5 h-3.5 text-rose-500" />
            Pesaje:
          </span>

          {[
            { label: '¼ kg (250g)', val: 0.25 },
            { label: '½ kg (500g)', val: 0.5 },
            { label: '¾ kg (750g)', val: 0.75 },
            { label: '1 kg', val: 1.0 },
            { label: '1.5 kg', val: 1.5 },
            { label: '2 kg', val: 2.0 },
          ].map((w) => {
            const isSelected = selectedWeight === w.val;
            return (
              <button
                key={w.val}
                type="button"
                onClick={() => onSelectWeight(isSelected ? null : w.val)}
                className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 ring-2 ring-rose-400'
                    : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200'
                }`}
              >
                {w.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenScaleModal}
            className="px-2.5 py-1 rounded-lg font-black text-[11px] bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1 ml-auto"
          >
            <Plus className="w-3 h-3" />
            <span>Peso Exacto...</span>
          </button>
        </div>
      )}

      {/* 2. RESTAURANTE: Selector de Mesas / Ubicación */}
      {normalizedType === 'restaurant' && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
            Ubicación:
          </span>

          {[
            'Mesa 1',
            'Mesa 2',
            'Mesa 3',
            'Mesa 4',
            'Mesa 5',
            'Barra',
            '🛵 Delivery',
            '🛍️ Para Llevar',
          ].map((tbl) => {
            const isSelected = selectedTable === tbl;
            return (
              <button
                key={tbl}
                type="button"
                onClick={() => onSelectTable(tbl)}
                className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200'
                }`}
              >
                {tbl}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. TIENDA DE ROPA: Selector de Tallas y Colores */}
      {normalizedType === 'clothing' && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
              <Shirt className="w-3.5 h-3.5 text-purple-500" />
              Talla:
            </span>
            {['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42'].map(
              (sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onSelectSize(isSelected ? null : sz)}
                    className={`px-2 py-0.5 rounded-md font-black text-[11px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                    }`}
                  >
                    {sz}
                  </button>
                );
              }
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
              Color:
            </span>
            {['Negro', 'Blanco', 'Azul', 'Rojo', 'Beige', 'Gris', 'Verde'].map(
              (col) => {
                const isSelected = selectedColor === col;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onSelectColor(isSelected ? null : col)}
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                    }`}
                  >
                    {col}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* 4. FARMACIA: Filtro Rápido de Categoría Terapéutica */}
      {normalizedType === 'pharmacy' && onQuickFilter && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
            <Pill className="w-3.5 h-3.5 text-teal-500" />
            Acceso Rápido:
          </span>
          {[
            'Analgésicos',
            'Antibióticos',
            'Gripe / Tos',
            'Vitaminas',
            'Cuidado Personal',
            'Inyectables',
          ].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onQuickFilter(cat)}
              className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60 hover:bg-teal-100 transition-all cursor-pointer"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 5. MINIMARKET: Modo Escáner y Packs */}
      {normalizedType === 'minimarket' && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            Opciones:
          </span>

          <span className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Lector de Código de Barras Listo
          </span>

          {onTogglePackDiscount && (
            <button
              type="button"
              onClick={onTogglePackDiscount}
              className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                packDiscountActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>Precio x Pack / Docena (-10%)</span>
            </button>
          )}
        </div>
      )}

      {/* 6. FERRETERÍA: Unidades Fraccionadas */}
      {normalizedType === 'hardware' && onSelectUnit && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            Unidad:
          </span>

          {['Pieza / UND', 'Metros (m)', 'Kilos (kg)', 'Bolsa / Saco'].map(
            (u) => {
              const isSelected = selectedUnit === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => onSelectUnit(u)}
                  className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              );
            }
          )}
        </div>
      )}

      {/* 7. HELADERÍA: Presentaciones */}
      {normalizedType === 'icecream' && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1 pr-1">
            <IceCream2 className="w-3.5 h-3.5 text-pink-500" />
            Presentación:
          </span>

          {[
            'Cono Simple',
            'Cono Doble',
            'Vaso Mediano',
            'Pote ¼ kg',
            'Pote ½ kg',
            'Pote 1 kg',
          ].map((pres) => (
            <button
              key={pres}
              type="button"
              onClick={() => onQuickFilter && onQuickFilter(pres)}
              className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 hover:bg-pink-100 transition-all cursor-pointer"
            >
              {pres}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
