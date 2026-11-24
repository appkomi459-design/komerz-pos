import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Truck,
  PackageCheck,
  TrendingDown,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  Trash2,
  Eye,
  Check,
  X,
  Sparkles,
  AlertTriangle,
  PackagePlus,
  Layers,
  ArrowRight,
  Printer,
  ChevronDown,
  Tag,
  Phone,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/formatters';
import type { Purchase, PurchaseItem, Supplier, Product, Category } from '@/types';

interface PurchaseItemDraft {
  tempId: string;
  isNewProduct: boolean;
  productId?: string;
  name: string;
  categoryId?: string;
  quantity: number;
  unitCost: number;
  salePrice?: number;
  currentStock?: number;
}

export const PurchasesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Modal Nueva Compra
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario de Compra
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItemDraft[]>([]);

  // Modo de adición de producto (Existente vs Nuevo)
  const [productAddMode, setProductAddMode] = useState<'existing' | 'new'>('existing');

  // Estado para añadir producto existente
  const [selectedProductId, setSelectedProductId] = useState('');
  const [existingQty, setExistingQty] = useState('1');
  const [existingCost, setExistingCost] = useState('');

  // Estado para añadir producto nuevo
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');

  // Modal Ver Detalle / Factura
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Modal Registrar Proveedor Rápido
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false);
  const [quickSupplierName, setQuickSupplierName] = useState('');
  const [quickSupplierPhone, setQuickSupplierPhone] = useState('');
  const [quickSupplierNit, setQuickSupplierNit] = useState('');
  const [savingQuickSupplier, setSavingQuickSupplier] = useState(false);

  // Cargar datos
  const fetchData = async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);

      const [purchasesRes, suppliersRes, prodsRes, catsRes] = await Promise.all([
        supabase
          .from('purchases')
          .select('*, supplier:suppliers(*), items:purchase_items(*)')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('suppliers')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('categories')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ]);

      if (purchasesRes.data) setPurchases(purchasesRes.data as Purchase[]);
      if (suppliersRes.data) setSuppliers(suppliersRes.data as Supplier[]);
      if (prodsRes.data) setProducts(prodsRes.data as Product[]);
      if (catsRes.data) setCategories(catsRes.data as Category[]);
    } catch (err) {
      console.error('Error cargando compras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBusiness?.id]);

  // Manejo de selección de producto existente
  const handleSelectExistingProduct = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setExistingCost(prod.cost_price ? String(prod.cost_price) : '0');
    }
  };

  // Añadir ítem existente al carrito de compra
  const handleAddExistingItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseFloat(existingQty) || 1;
    const cost = parseFloat(existingCost) || 0;

    // Verificar si ya está en la lista para sumarle cantidad
    const existingIndex = items.findIndex((i) => !i.isNewProduct && i.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].unitCost = cost;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          tempId: `exist-${Date.now()}-${Math.random()}`,
          isNewProduct: false,
          productId: prod.id,
          name: prod.name,
          quantity: qty,
          unitCost: cost,
          currentStock: prod.stock,
        },
      ]);
    }

    // Resetear formulario de ítem
    setSelectedProductId('');
    setExistingQty('1');
    setExistingCost('');
  };

  // Añadir ítem nuevo al carrito de compra
  const handleAddNewItem = () => {
    if (!newName.trim()) {
      setError('Escribe el nombre del nuevo producto.');
      return;
    }
    const qty = parseFloat(newQty) || 1;
    const cost = parseFloat(newCostPrice) || 0;
    const sale = parseFloat(newSalePrice) || 0;

    if (cost < 0 || sale < 0) {
      setError('Los precios no pueden ser negativos.');
      return;
    }

    setItems([
      ...items,
      {
        tempId: `new-${Date.now()}-${Math.random()}`,
        isNewProduct: true,
        name: newName.trim(),
        categoryId: newCategoryId || undefined,
        quantity: qty,
        unitCost: cost,
        salePrice: sale,
        currentStock: 0,
      },
    ]);

    // Resetear campos
    setNewName('');
    setNewCategoryId('');
    setNewQty('1');
    setNewCostPrice('');
    setNewSalePrice('');
    setError(null);
  };

  // Quitar ítem
  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter((i) => i.tempId !== tempId));
  };

  // Modificar cantidad o costo directamente en la tabla
  const handleUpdateItem = (tempId: string, field: 'quantity' | 'unitCost', value: number) => {
    setItems(
      items.map((i) => {
        if (i.tempId === tempId) {
          return { ...i, [field]: value };
        }
        return i;
      })
    );
  };

  // Totales calculados
  const calculatedSubtotal = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity * curr.unitCost, 0);
  }, [items]);

  const calculatedTotal = calculatedSubtotal;

  // Abrir Modal de Nueva Compra
  const handleOpenNewPurchase = () => {
    setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    setInvoiceNumber('');
    setPaymentMethod('cash');
    setPaymentStatus('paid');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([]);
    setSelectedProductId('');
    setExistingQty('1');
    setExistingCost('');
    setNewName('');
    setNewCategoryId('');
    setNewQty('1');
    setNewCostPrice('');
    setNewSalePrice('');
    setError(null);
    setIsModalOpen(true);
  };

  // Guardar Compra e Impactar Stock
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;

    if (!supplierId) {
      setError('Por favor selecciona o registra un proveedor.');
      return;
    }

    if (items.length === 0) {
      setError('Debes agregar al menos un producto a la compra.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1. Generar número de compra secuencial/único
      const purchaseNumber = `COM-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Insertar compra principal
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          business_id: activeBusiness.id,
          supplier_id: supplierId,
          purchase_number: purchaseNumber,
          invoice_number: invoiceNumber.trim() || null,
          subtotal: calculatedSubtotal,
          tax: 0,
          total: calculatedTotal,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          status: 'completed',
          notes: notes.trim() || null,
          created_at: new Date(purchaseDate).toISOString(),
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const createdPurchaseId = purchaseData.id;

      // 3. Procesar cada ítem (crear nuevo o actualizar existente y registrar en purchase_items)
      for (const item of items) {
        let finalProductId = item.productId;

        if (item.isNewProduct) {
          // Crear producto nuevo en la base de datos
          const generatedSku = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
          const { data: newProdData, error: newProdError } = await supabase
            .from('products')
            .insert({
              business_id: activeBusiness.id,
              category_id: item.categoryId || null,
              name: item.name,
              sku: generatedSku,
              cost_price: item.unitCost,
              sale_price: item.salePrice || item.unitCost * 1.3,
              stock: item.quantity,
              min_stock: 5,
              unit: 'UND',
              is_active: true,
            })
            .select()
            .single();

          if (newProdError) throw newProdError;
          finalProductId = newProdData.id;
        } else if (finalProductId) {
          // Actualizar producto existente: SUMAR AL STOCK y actualizar PRECIO DE COSTO
          const currentProd = products.find((p) => p.id === finalProductId);
          const currentStock = currentProd ? Number(currentProd.stock) : 0;
          const newStock = currentStock + item.quantity;

          const { error: updateProdError } = await supabase
            .from('products')
            .update({
              stock: newStock,
              cost_price: item.unitCost, // Actualiza al último costo de reposición
            })
            .eq('id', finalProductId);

          if (updateProdError) throw updateProdError;
        }

        // Registrar en purchase_items
        const { error: itemError } = await supabase.from('purchase_items').insert({
          purchase_id: createdPurchaseId,
          product_id: finalProductId,
          product_name: item.name,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.quantity * item.unitCost,
        });

        if (itemError) throw itemError;
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error al guardar compra:', err);
      setError(err?.message || 'Error al procesar la compra.');
    } finally {
      setSaving(false);
    }
  };

  // Crear Proveedor Rápido
  const handleSaveQuickSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;
    if (!quickSupplierName.trim()) return;

    try {
      setSavingQuickSupplier(true);
      const { data, error: suppErr } = await supabase
        .from('suppliers')
        .insert({
          business_id: activeBusiness.id,
          name: quickSupplierName.trim(),
          phone: quickSupplierPhone.trim() || null,
          identification: quickSupplierNit.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (suppErr) throw suppErr;

      setSuppliers([...suppliers, data as Supplier]);
      setSupplierId(data.id);
      setIsQuickSupplierOpen(false);
      setQuickSupplierName('');
      setQuickSupplierPhone('');
      setQuickSupplierNit('');
    } catch (err: any) {
      alert(err.message || 'Error al registrar proveedor.');
    } finally {
      setSavingQuickSupplier(false);
    }
  };

  // Métricas
  const totalSpent = useMemo(() => {
    return purchases
      .filter((p) => p.status === 'completed')
      .reduce((acc, p) => acc + Number(p.total), 0);
  }, [purchases]);

  const uniqueSuppliersCount = useMemo(() => {
    const sIds = new Set(purchases.map((p) => p.supplier_id).filter(Boolean));
    return sIds.size;
  }, [purchases]);

  const totalUnitsBought = useMemo(() => {
    return purchases.reduce((acc, p) => {
      const itemsCount = p.items?.reduce((iAcc, item) => iAcc + Number(item.quantity), 0) || 0;
      return acc + itemsCount;
    }, 0);
  }, [purchases]);

  // Filtrado de compras
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch =
        p.purchase_number.toLowerCase().includes(search.toLowerCase()) ||
        (p.invoice_number && p.invoice_number.toLowerCase().includes(search.toLowerCase())) ||
        (p.supplier?.name && p.supplier.name.toLowerCase().includes(search.toLowerCase()));

      const matchesSupplier =
        supplierFilter === 'all' || p.supplier_id === supplierFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && p.payment_status === 'paid') ||
        (statusFilter === 'pending' && p.payment_status === 'pending');

      return matchesSearch && matchesSupplier && matchesStatus;
    });
  }, [purchases, search, supplierFilter, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* CABECERA PRINCIPAL CON ESTILO ESMERALDA CORPORATIVO      */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Compras y Reabastecimiento
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Registra compras a proveedores, costos y actualiza el stock automáticamente
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenNewPurchase}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 rounded-xl px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Compra</span>
        </Button>
      </div>

      {/* ======================================================== */}
      {/* TARJETAS DE MÉTRICAS (ESTILO SUCURSALES)                 */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. TOTAL INVERTIDO (Verde Esmeralda) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              Total Invertido
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono truncate">
              Bs {totalSpent.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-emerald-100 font-bold mt-0.5">
              Gastos en mercadería
            </p>
          </div>
        </div>

        {/* 2. ÓRDENES DE COMPRA (Azul Cobalto) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">
              Órdenes de Compra
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {purchases.length}
            </div>
            <p className="text-[10px] text-blue-100 font-bold mt-0.5">
              Recepciones registradas
            </p>
          </div>
        </div>

        {/* 3. PROVEEDORES (Púrpura / Índigo) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-100">
              Proveedores
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {uniqueSuppliersCount}
            </div>
            <p className="text-[10px] text-purple-100 font-bold mt-0.5">
              Distribuidores activos
            </p>
          </div>
        </div>

        {/* 4. UNIDADES INGRESADAS (Ámbar / Naranja) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
              Unidades Ingresadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {totalUnitsBought.toLocaleString('es-BO')}
            </div>
            <p className="text-[10px] text-amber-100 font-bold mt-0.5">
              Sumadas al inventario
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE BÚSQUEDA Y FILTROS                              */}
      {/* ======================================================== */}
      <Card className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por N° compra (COM-...), factura de proveedor o distribuidora..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro por Proveedor */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">Todos los Proveedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Filtro por Estado de Pago */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'paid'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                Pagadas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs font-black'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                A Crédito
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* TABLA PRINCIPAL DE HISTORIAL DE COMPRAS                  */}
      {/* ======================================================== */}
      <Card className="overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Cargando historial de compras...
            </p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3.5">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
              {search || supplierFilter !== 'all' || statusFilter !== 'all'
                ? 'No se encontraron compras con los filtros seleccionados'
                : 'No tienes compras registradas aún'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
              Registra la recepción de mercadería de tus proveedores para reponer automáticamente el stock de tus productos.
            </p>
            <Button
              onClick={handleOpenNewPurchase}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl px-4 py-2 cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Compra</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/40 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">N° Compra / Fecha</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">N° Factura / Remisión</th>
                  <th className="py-3 px-4">Productos Ingresados</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4">Total Pagado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                {filteredPurchases.map((p) => {
                  const itemCount = p.items?.length || 0;
                  const totalUnits = p.items?.reduce((acc, i) => acc + Number(i.quantity), 0) || 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* N° Compra y Fecha */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-black text-slate-900 dark:text-zinc-100">
                          {p.purchase_number}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(p.created_at)}</span>
                        </div>
                      </td>

                      {/* Proveedor */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 dark:text-zinc-100 font-black">
                          {p.supplier?.name || 'Proveedor General'}
                        </div>
                        {p.supplier?.phone && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{p.supplier.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* N° Factura / Remisión */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.invoice_number ? (
                          <span className="font-mono text-[11px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-zinc-300">
                            {p.invoice_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Sin comprobante</span>
                        )}
                      </td>

                      {/* Productos ingresados */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-zinc-300">
                          <span className="font-black text-emerald-600 dark:text-emerald-400">{itemCount}</span>{' '}
                          {itemCount === 1 ? 'producto' : 'productos'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          ({totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'})
                        </div>
                      </td>

                      {/* Método de Pago */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            p.payment_status === 'pending'
                              ? 'amber'
                              : p.payment_method === 'transfer'
                              ? 'blue'
                              : 'emerald'
                          }
                          size="sm"
                        >
                          {p.payment_status === 'pending'
                            ? 'Crédito (Por Pagar)'
                            : p.payment_method === 'transfer'
                            ? 'Transferencia / QR'
                            : 'Efectivo'}
                        </Badge>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          Bs {Number(p.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <Check className="w-2.5 h-2.5" />
                          Ingresado a Stock
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setViewingPurchase(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Factura</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR NUEVA COMPRA (COMPACTO Y CENTRADO)      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="max-w-2xl p-0 overflow-hidden shadow-2xl"
        >
          {/* Cabecera Esmeralda / Menta */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-3.5 text-white flex items-center justify-between relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                <ShoppingBag className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight leading-none">
                  Registrar Nueva Compra de Mercadería
                </h3>
                <p className="text-[10px] text-emerald-100/90 mt-0.5">
                  Ingresa las facturas de proveedores y actualiza el stock automáticamente
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSavePurchase} className="p-4 sm:p-5 space-y-4 bg-white dark:bg-zinc-900 max-h-[82vh] overflow-y-auto">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Fila 1: Datos Generales (Proveedor, Factura, Método de Pago) */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  1. Datos del Proveedor y Comprobante
                </span>
                <button
                  type="button"
                  onClick={() => setIsQuickSupplierOpen(true)}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Registrar Proveedor Nuevo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Proveedor */}
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                    Proveedor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="">Selecciona un proveedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* N° Factura / Nota */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                    N° Factura / Remisión (Opcional)
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ej. FAC-90234 o Remisión 12"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      const val = e.target.value as 'cash' | 'transfer' | 'credit';
                      setPaymentMethod(val);
                      if (val === 'credit') setPaymentStatus('pending');
                      else setPaymentStatus('paid');
                    }}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="cash">Efectivo (Contado)</option>
                    <option value="transfer">Transferencia / QR</option>
                    <option value="credit">A Crédito (Por Pagar)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fila 2: Selector para Agregar Productos a la Compra */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>2. Añadir Productos a la Compra</span>
                </span>

                {/* Tabs: Producto Existente vs Producto Nuevo */}
                <div className="flex items-center bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-emerald-200 dark:border-zinc-700 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => {
                      setProductAddMode('existing');
                      setError(null);
                    }}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      productAddMode === 'existing'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-emerald-600'
                    }`}
                  >
                    Del Catálogo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProductAddMode('new');
                      setError(null);
                    }}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      productAddMode === 'new'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-emerald-600'
                    }`}
                  >
                    + Crear Producto Nuevo
                  </button>
                </div>
              </div>

              {productAddMode === 'existing' ? (
                /* Modo Producto Existente */
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                      Seleccionar Producto
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleSelectExistingProduct(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="">Buscar producto existente...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock actual: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                      Cant. Comprada
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={existingQty}
                      onChange={(e) => setExistingQty(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                      Costo Unit. (Bs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={existingCost}
                      onChange={(e) => setExistingCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={!selectedProductId}
                      onClick={handleAddExistingItem}
                      className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo Crear Producto Nuevo */
                <div className="space-y-2 bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-emerald-200 dark:border-zinc-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                        Nombre del Nuevo Producto <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej. Aceite Fino 1 Litro"
                        className="w-full px-2.5 py-1 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                        Categoría (Opcional)
                      </label>
                      <select
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="">Sin categoría asignada</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                        Cant. a Ingresar <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                        Costo Compra (Bs) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newCostPrice}
                        onChange={(e) => setNewCostPrice(e.target.value)}
                        placeholder="Ej. 10.50"
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-0.5">
                        Precio Venta Sugerido (Bs)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newSalePrice}
                        onChange={(e) => setNewSalePrice(e.target.value)}
                        placeholder="Ej. 14.00"
                        className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddNewItem}
                        className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Crear y Añadir</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fila 3: Tabla de Productos en la Orden de Compra */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <span>3. Productos en esta Compra ({items.length})</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  Subtotal: Bs {calculatedSubtotal.toFixed(2)}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl">
                  <PackageCheck className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                    Aún no has agregado ningún producto
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Selecciona productos de tu catálogo o añade uno nuevo en el recuadro superior.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-2 text-center">Tipo</th>
                        <th className="py-2 px-2 text-center w-20">Cantidad</th>
                        <th className="py-2 px-2 text-right w-24">Costo Unit. (Bs)</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                      {items.map((item) => (
                        <tr key={item.tempId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                          <td className="py-2 px-3">
                            <div className="text-slate-900 dark:text-zinc-100 font-black">
                              {item.name}
                            </div>
                            {!item.isNewProduct && (
                              <div className="text-[9px] text-slate-400 font-medium">
                                Stock actual: {item.currentStock} → Quedará en:{' '}
                                <span className="text-emerald-600 font-bold">
                                  {(item.currentStock || 0) + item.quantity}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {item.isNewProduct ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                ✨ Nuevo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                Existente
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.tempId, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded text-center text-xs font-mono font-bold"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) =>
                                handleUpdateItem(item.tempId, 'unitCost', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-1.5 py-0.5 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded text-right text-xs font-mono font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                            Bs {(item.quantity * item.unitCost).toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.tempId)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fila 4: Total & Observaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Entregado por chofer Juan. Pedido completo."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Total a Pagar / Registrado
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {items.length} productos ({items.reduce((acc, i) => acc + i.quantity, 0)} unidades)
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  Bs {calculatedTotal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || items.length === 0}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Ingresando al Stock...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Compra y Sumar al Stock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRO RÁPIDO DE PROVEEDOR                     */}
      {/* ======================================================== */}
      {isQuickSupplierOpen && (
        <Modal
          isOpen={isQuickSupplierOpen}
          onClose={() => setIsQuickSupplierOpen(false)}
          className="max-w-md p-0 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-5 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-200" />
              <h3 className="text-xs font-black text-white">Registrar Proveedor Rápido</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickSupplierOpen(false)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveQuickSupplier} className="p-4 space-y-3 bg-white dark:bg-zinc-900">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 mb-1">
                Empresa o Distribuidora <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={quickSupplierName}
                onChange={(e) => setQuickSupplierName(e.target.value)}
                placeholder="Ej. Distribuidora San Jorge S.R.L."
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 mb-1">
                  NIT / Identificación
                </label>
                <input
                  type="text"
                  value={quickSupplierNit}
                  onChange={(e) => setQuickSupplierNit(e.target.value)}
                  placeholder="Ej. 1020304050"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-zinc-400 mb-1">
                  Celular / WhatsApp
                </label>
                <input
                  type="text"
                  value={quickSupplierPhone}
                  onChange={(e) => setQuickSupplierPhone(e.target.value)}
                  placeholder="Ej. 70123456"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsQuickSupplierOpen(false)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-zinc-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingQuickSupplier}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg cursor-pointer"
              >
                {savingQuickSupplier ? 'Guardando...' : 'Guardar y Seleccionar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: DETALLE / FACTURA DE COMPRA                      */}
      {/* ======================================================== */}
      {viewingPurchase && (
        <Modal
          isOpen={!!viewingPurchase}
          onClose={() => setViewingPurchase(null)}
          className="max-w-lg p-0 overflow-hidden shadow-2xl"
        >
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  Comprobante de Recepción: {viewingPurchase.purchase_number}
                </h3>
                <p className="text-[10px] text-slate-300">
                  Emitido el {formatDate(viewingPurchase.created_at)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingPurchase(null)}
              className="p-1 rounded-lg text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 bg-white dark:bg-zinc-900 text-xs">
            {/* Tarjeta del Proveedor */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Proveedor de Mercadería
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {viewingPurchase.invoice_number ? `Factura: ${viewingPurchase.invoice_number}` : 'Sin N° Factura'}
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-zinc-100">
                {viewingPurchase.supplier?.name || 'Proveedor General'}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-zinc-400">
                {viewingPurchase.supplier?.identification && (
                  <span>NIT: <strong className="font-mono text-slate-700 dark:text-zinc-200">{viewingPurchase.supplier.identification}</strong></span>
                )}
                {viewingPurchase.supplier?.phone && (
                  <span>Cel: <strong className="font-mono text-slate-700 dark:text-zinc-200">{viewingPurchase.supplier.phone}</strong></span>
                )}
              </div>
            </div>

            {/* Lista de Productos Comprados */}
            <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-[10px] font-black uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700 flex justify-between">
                <span>Producto / Ítem</span>
                <span>Subtotal</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-56 overflow-y-auto">
                {viewingPurchase.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-zinc-200">
                        {item.product_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.quantity} unidades × Bs {Number(item.unit_cost).toFixed(2)} c/u
                      </div>
                    </div>
                    <div className="font-mono font-black text-slate-900 dark:text-zinc-100">
                      Bs {Number(item.total_cost).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                  Total Pagado en Compra
                </span>
                <p className="text-[10px] text-slate-500">
                  Método:{' '}
                  {viewingPurchase.payment_method === 'cash'
                    ? 'Efectivo'
                    : viewingPurchase.payment_method === 'transfer'
                    ? 'Transferencia'
                    : 'A Crédito'}
                </p>
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                Bs {Number(viewingPurchase.total).toFixed(2)}
              </div>
            </div>

            {viewingPurchase.notes && (
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 italic bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                "{viewingPurchase.notes}"
              </p>
            )}

            {/* Botones */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprobante</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
