import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  Package,
  Users,
  Tags,
  Truck,
  TrendingDown,
  Building2,
  Receipt,
  UserCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  TrashItemRecord,
  TrashItemType,
  fetchTrashItems,
  restoreTrashItem,
  removeFromTrashStorage,
  emptyTrash,
} from '@/utils/trash';

const TYPE_META: Record<
  TrashItemType,
  { label: string; colorClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  product: {
    label: 'Producto',
    colorClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    icon: Package,
  },
  category: {
    label: 'Categoría',
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Tags,
  },
  customer: {
    label: 'Cliente',
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: Users,
  },
  supplier: {
    label: 'Proveedor',
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Truck,
  },
  expense: {
    label: 'Gasto',
    colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: TrendingDown,
  },
  branch: {
    label: 'Sucursal',
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    icon: Building2,
  },
  sale: {
    label: 'Venta',
    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Receipt,
  },
  employee: {
    label: 'Vendedor',
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
    icon: UserCheck,
  },
};

export const TrashPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [items, setItems] = useState<TrashItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TrashItemType | 'all'>('all');
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadItems = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    const data = await fetchTrashItems(activeBusiness.id);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [activeBusiness?.id]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = filterType === 'all' || item.item_type === filterType;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [items, filterType, search]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      products: items.filter((i) => i.item_type === 'product').length,
      restorable: items.filter((i) => i.item_type !== 'sale').length,
      sales: items.filter((i) => i.item_type === 'sale').length,
    };
  }, [items]);

  const handleRestore = async (item: TrashItemRecord) => {
    setBusyId(item.id);
    setActionMsg(null);
    const { error } = await restoreTrashItem(item);
    setBusyId(null);
    if (error) {
      setActionMsg({ type: 'err', text: error });
    } else {
      setActionMsg({ type: 'ok', text: `"${item.title}" fue restaurado correctamente.` });
      await loadItems();
    }
  };

  const handlePermanentDelete = async (item: TrashItemRecord) => {
    if (!window.confirm(`¿Eliminar definitivamente "${item.title}" de la papelera?`)) return;
    setBusyId(item.id);
    await removeFromTrashStorage(item);
    setBusyId(null);
    setActionMsg({ type: 'ok', text: `"${item.title}" eliminado de la papelera.` });
    await loadItems();
  };

  const handleEmptyTrash = async () => {
    if (!activeBusiness || items.length === 0) return;
    if (!window.confirm('¿Vaciar toda la papelera? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    await emptyTrash(activeBusiness.id);
    setActionMsg({ type: 'ok', text: 'La papelera ha sido vaciada.' });
    await loadItems();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Papelera
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Historial de elementos eliminados — restaura o borra definitivamente
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            className="px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            Vaciar Papelera
          </button>
        )}
      </div>

      {/* KPI Cards (Estilo Sucursales) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-100">EN PAPELERA</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">{counts.total}</div>
            <p className="text-[10px] text-rose-100 font-bold mt-0.5">Registros eliminados</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">PRODUCTOS</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">{counts.products}</div>
            <p className="text-[10px] text-blue-100 font-bold mt-0.5">Productos borrados</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">RESTAURABLES</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">{counts.restorable}</div>
            <p className="text-[10px] text-emerald-100 font-bold mt-0.5">Listos para recuperar</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">VENTAS</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">{counts.sales}</div>
            <p className="text-[10px] text-amber-100 font-bold mt-0.5">Tickets anulados</p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            actionMsg.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {actionMsg.type === 'ok' ? (
            <Sparkles className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en la papelera por nombre o detalle..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            Todos ({items.length})
          </button>
          {(Object.keys(TYPE_META) as TrashItemType[]).map((typeKey) => {
            const count = items.filter((i) => i.item_type === typeKey).length;
            if (count === 0) return null;
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => setFilterType(typeKey)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                  filterType === typeKey
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
              >
                {TYPE_META[typeKey].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400">Cargando papelera...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400">
              <Trash2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-black text-slate-700 dark:text-zinc-200">
              La papelera está vacía
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Todo lo que elimines en Productos, Clientes, Proveedores, Gastos, Sucursales, Ventas o Vendedores aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {filteredItems.map((item) => {
              const meta = TYPE_META[item.item_type] || TYPE_META.product;
              const Icon = meta.icon;
              const isRestorable = item.item_type !== 'sale';
              const isBusy = busyId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${meta.colorClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Eliminado el {new Date(item.deleted_at).toLocaleString('es-BO')}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate mt-1">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isRestorable && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestore(item)}
                        className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePermanentDelete(item)}
                      className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Eliminar definitivamente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Borrar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
