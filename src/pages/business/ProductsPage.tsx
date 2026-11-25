import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Tag,
  Barcode,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Dices,
  Layers,
  ArrowRight,
  TrendingDown,
  Printer,
  Edit3,
  Boxes,
  TrendingUp,
  Camera,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { recordTrashItem } from '@/utils/trash';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/utils/formatters';
import type { Product, Category } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { BarcodeCameraModal } from '@/components/common/BarcodeCameraModal';
import { ScanResultCard, type ScanResultData } from '@/components/common/ScanResultCard';
import { lookupBarcodeOnline } from '@/utils/barcodeLookup';

export const ProductsPage: React.FC = () => {
  const { activeBusiness, settings, currentRole } = useBusiness();
  const { t } = useLanguage();
  const isCashier = currentRole === 'cashier';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal create product state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('PROD-3400');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('5');
  const [productCurrency, setProductCurrency] = useState<'BOB' | 'USD'>('BOB');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editProductCurrency, setEditProductCurrency] = useState<'BOB' | 'USD'>('BOB');
  const [editProductImage, setEditProductImage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Color de impresión/factura — se guarda en localStorage por negocio
  const [printColor, setPrintColor] = useState<string>(() => {
    return localStorage.getItem('komi_print_color') || '#6d28d9';
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Paleta de colores vivos para la cabecera de impresión
  const PRINT_COLORS = [
    { hex: '#6d28d9', label: 'Púrpura Real',      gradient: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)' },
    { hex: '#be123c', label: 'Rojo Carmesí',      gradient: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)' },
    { hex: '#0369a1', label: 'Azul Oceánico',     gradient: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)' },
    { hex: '#047857', label: 'Verde Esmeralda',   gradient: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)' },
    { hex: '#c2410c', label: 'Naranja Volcánico', gradient: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)' },
    { hex: '#db2777', label: 'Rosa Fucsia',       gradient: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)' },
    { hex: '#0f766e', label: 'Teal Profundo',     gradient: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)' },
    { hex: '#7c2d12', label: 'Marrón Vino',       gradient: 'linear-gradient(135deg, #7c2d12 0%, #431407 100%)' },
    { hex: '#1d4ed8', label: 'Azul Zafiro',       gradient: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)' },
    { hex: '#b45309', label: 'Ámbar Dorado',      gradient: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' },
    { hex: '#7e22ce', label: 'Violeta Neon',      gradient: 'linear-gradient(135deg, #7e22ce 0%, #581c87 100%)' },
    { hex: '#0f172a', label: 'Negro Elegante',    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  ];

  const activePrintColor = PRINT_COLORS.find(c => c.hex === printColor) || PRINT_COLORS[0];

  const handleSelectPrintColor = (hex: string) => {
    setPrintColor(hex);
    localStorage.setItem('komi_print_color', hex);
    setShowColorPicker(false);
  };

  // Generador del enlace directo al Catálogo Digital Oficial del Negocio
  const getCatalogQrUrl = () => {
    if (!activeBusiness) return window.location.origin;
    const identifier = activeBusiness.slug || activeBusiness.id;
    // Si estamos en localhost durante desarrollo, usar la IP de la red local para que el celular pueda abrirlo
    let base = window.location.origin;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      base = `http://192.168.0.12:${window.location.port || '5173'}`;
    }
    return `${base}/c/${identifier}`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const currency = activeBusiness?.currency || 'BOB';

  const fetchProductsAndCategories = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);

      const [prodsRes, catsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*)')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true),
      ]);

      if (prodsRes.data) setProducts(prodsRes.data as Product[]);
      if (catsRes.data) setCategories(catsRes.data as Category[]);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, [activeBusiness]);

  const generateSkuCode = () => {
    const code = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    setSku(code);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    setError(null);

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      const generatedSku = sku.trim() || `PROD-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error: insertError } = await supabase.from('products').insert({
        business_id: activeBusiness.id,
        category_id: categoryId || null,
        name: name.trim(),
        sku: generatedSku,
        barcode: barcode.trim() || null,
        cost_price: parseFloat(costPrice) || 0,
        sale_price: parseFloat(salePrice) || 0,
        stock: parseFloat(stock) || 0,
        min_stock: parseFloat(minStock) || 5,
        image_url: productImage || null,
        is_active: true,
      });

      if (insertError) throw insertError;

      // Reset form
      setName('');
      setDescription('');
      setCategoryId('');
      setSku('PROD-3400');
      setBarcode('');
      setCostPrice('');
      setSalePrice('');
      setStock('10');
      setMinStock('5');
      setProductImage(null);
      setIsModalOpen(false);

      await fetchProductsAndCategories();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name || '');
    setEditDescription('');
    setEditCategoryId(p.category_id || '');
    setEditSku(p.sku || '');
    setEditBarcode(p.barcode || '');
    setEditCostPrice(p.cost_price !== undefined ? String(p.cost_price) : '');
    setEditSalePrice(p.sale_price !== undefined ? String(p.sale_price) : '');
    setEditStock(p.stock !== undefined ? String(p.stock) : '0');
    setEditMinStock(p.min_stock !== undefined ? String(p.min_stock) : '5');
    setEditProductImage(p.image_url || null);
    setEditProductCurrency(currency === 'USD' ? 'USD' : 'BOB');
    setEditError(null);
  };

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProductImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !activeBusiness) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError('El nombre del producto es obligatorio.');
      return;
    }

    try {
      setUpdating(true);
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          name: editName.trim(),
          category_id: editCategoryId || null,
          sku: editSku.trim() || null,
          barcode: editBarcode.trim() || null,
          cost_price: parseFloat(editCostPrice) || 0,
          sale_price: parseFloat(editSalePrice) || 0,
          stock: parseFloat(editStock) || 0,
          min_stock: parseFloat(editMinStock) || 5,
          image_url: editProductImage || null,
        })
        .eq('id', editingProduct.id);

      if (updateErr) throw updateErr;

      setEditingProduct(null);
      await fetchProductsAndCategories();
    } catch (err: any) {
      console.error('Error updating product:', err);
      setEditError(err?.message || 'Error al actualizar el producto.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el producto "${p.name}" de tu inventario?`
    );
    if (!confirmed) return;

    try {
      // Intento de eliminación física
      const { error: delErr } = await supabase
        .from('products')
        .delete()
        .eq('id', p.id);

      if (delErr) {
        // Si hay llaves foráneas en ventas, hacemos borrado suave (is_active = false)
        console.warn('Fallo eliminación directa, aplicando desactivación:', delErr);
        const { error: softErr } = await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', p.id);

        if (softErr) throw softErr;
      }

      if (activeBusiness) {
        await recordTrashItem({
          businessId: activeBusiness.id,
          itemType: 'product',
          itemId: p.id,
          title: p.name,
          subtitle: `Precio: ${p.sale_price} · Stock: ${p.stock}${p.sku ? ` · SKU: ${p.sku}` : ''}`,
          payload: p as unknown as Record<string, any>,
        });
      }

      await fetchProductsAndCategories();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert('No se pudo eliminar el producto: ' + (err?.message || 'Error'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search)) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // ---- BARCODE SCANNER (pistola USB / Bluetooth + cámara) ----
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cameraTarget, setCameraTarget] = useState<'search' | 'create' | 'edit' | null>(null);
  const isCameraOpen = cameraTarget !== null;

  const showProductScanResult = (data: ScanResultData) => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setScanResult(data);
    scanTimerRef.current = setTimeout(() => setScanResult(null), 4000);
  };

  // Desactivar cuando el modal de edición/creación esté abierto
  const productScannerActive = !isModalOpen && !editingProduct && !isCameraOpen;

  const handleProductBarcodeScan = async (code: string) => {
    const clean = code.trim();
    // 1. Buscar producto por barcode o SKU exacto en el inventario local
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.trim() === clean) ||
        (p.sku && p.sku.trim() === clean)
    );

    if (found) {
      // Producto encontrado: filtrar tabla y mostrar tarjeta con imagen/nombre/código
      setSearch(clean);
      showProductScanResult({
        code: found.barcode || found.sku || clean,
        name: found.name,
        imageUrl: found.image_url,
        price: found.sale_price,
        stock: found.stock,
        currency,
        status: 'found',
        message: 'Encontrado en Stock',
      });
      return;
    }

    // 2. Producto NO encontrado en inventario: abrir modal con código pre-cargado
    setBarcode(clean);
    setName('');
    setProductImage(null);
    setSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsModalOpen(true);

    showProductScanResult({
      code: clean,
      status: 'new',
      message: 'Código nuevo — completá los datos',
    });

    // 3. Intentar buscar nombre e imagen en catálogo público (OpenFoodFacts)
    const online = await lookupBarcodeOnline(clean);
    if (online) {
      if (online.name) setName((prev) => prev || online.name || '');
      if (online.imageUrl) setProductImage((prev) => prev || online.imageUrl || null);
      showProductScanResult({
        code: clean,
        name: online.name,
        imageUrl: online.imageUrl,
        status: 'online_match',
        message: 'Datos sugeridos automáticamente',
      });
    }
  };

  const handleModalCameraScan = async (code: string, target: 'search' | 'create' | 'edit') => {
    const clean = code.trim();
    if (target === 'search') {
      await handleProductBarcodeScan(clean);
      return;
    }

    if (target === 'edit') {
      setEditBarcode(clean);
      showProductScanResult({
        code: clean,
        name: editName || undefined,
        imageUrl: editProductImage,
        status: 'found',
        message: 'Código de barras actualizado',
      });
      return;
    }

    // target === 'create'
    setBarcode(clean);
    showProductScanResult({
      code: clean,
      name: name || undefined,
      imageUrl: productImage,
      status: 'new',
      message: 'Código capturado',
    });

    const online = await lookupBarcodeOnline(clean);
    if (online) {
      if (online.name) setName((prev) => prev || online.name || '');
      if (online.imageUrl) setProductImage((prev) => prev || online.imageUrl || null);
      showProductScanResult({
        code: clean,
        name: online.name || name || undefined,
        imageUrl: online.imageUrl || productImage,
        status: 'online_match',
        message: 'Datos sugeridos automáticamente',
      });
    }
  };

  useBarcodeScanner(handleProductBarcodeScan, productScannerActive);

  // Productos con Stock Bajo o Crítico
  const lowStockProducts = products.filter(
    (p) => p.is_active && Number(p.stock) <= Number(p.min_stock)
  );

  // Ordenar para que los productos con Stock Bajo aparezcan PRIMERO en la tabla
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aLow = a.is_active && Number(a.stock) <= Number(a.min_stock);
    const bLow = b.is_active && Number(b.stock) <= Number(b.min_stock);
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;
    if (aLow && bLow) {
      return Number(a.stock) - Number(b.stock); // Primero el de menor stock
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* ===== TARJETA RESULTADO ESCÁNER DE BARRAS ===== */}
      <ScanResultCard result={scanResult} onClose={() => setScanResult(null)} />

      {/* ======================================================== */}
      {/* CABECERA DE LA PÁGINA Y BOTONES DE ACCIÓN                  */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            {t('products.title', 'Productos / Stock')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {t('products.subtitle', 'Gestión de catálogo e inventario')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Selector de Color de Impresión */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(v => !v)}
              className="px-3 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Color de impresión / factura"
            >
              <span
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style={{ background: activePrintColor.gradient }}
              />
              <span className="hidden sm:inline">Color Impresión</span>
            </button>

            {/* Paleta de colores */}
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-zinc-700 p-4 w-72">
                <p className="text-xs font-black text-slate-700 dark:text-zinc-200 mb-3 uppercase tracking-wider">
                  🎨 Color de Encabezado para Impresión
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {PRINT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleSelectPrintColor(c.hex)}
                      title={c.label}
                      className={`w-9 h-9 rounded-xl cursor-pointer transition-all active:scale-90 shadow-md ${
                        printColor === c.hex
                          ? 'ring-3 ring-offset-2 ring-slate-900 dark:ring-white scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ background: c.gradient, border: 'none' }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-3">
                  Seleccionado: <span className="text-slate-700 dark:text-zinc-200">{activePrintColor.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Botón Imprimir */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="Imprimir lista e inventario de productos"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <span>{t('common.print', 'Imprimir')}</span>
          </button>

          {/* Botón Nuevo Producto */}
          {!isCashier && (
            <button
              onClick={() => {
                generateSkuCode();
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('products.new', 'Nuevo Producto')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TARJETAS KPI DE RENDIMIENTO (ESTILO SUCURSALES)          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 no-print">
        {/* Total Productos */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              Total Productos
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {products.length}
            </div>
            <p className="text-[10px] text-emerald-100 font-bold mt-0.5">
              Artículos en catálogo
            </p>
          </div>
        </div>

        {/* Stock Disponible */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">
              Stock Disponible
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Boxes className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0)}
            </div>
            <p className="text-[10px] text-blue-100 font-bold mt-0.5">
              Unidades físicas totales
            </p>
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-100">
              Stock Bajo
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {lowStockProducts.length}
            </div>
            <p className="text-[10px] text-purple-100 font-bold mt-0.5">
              {lowStockProducts.length > 0 ? 'Por agotarse o mínimo' : 'Inventario en orden'}
            </p>
          </div>
        </div>

        {/* Valor Comercial */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-100">
              Valor Comercial
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono truncate">
              {formatCurrency(products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.sale_price) || 0)), 0), currency)}
            </div>
            <p className="text-[10px] text-amber-100 font-bold mt-0.5">
              Capital total estimado
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NOTIFICACIÓN ARRIBA: ALERTA DE STOCK BAJO               */}
      {/* ======================================================== */}
      {lowStockProducts.length > 0 && (
        <div className="no-print p-4.5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 dark:text-amber-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md shadow-amber-500/25">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-amber-950 dark:text-amber-100">
                  ¡Atención de Inventario! Tienes productos con Stock Bajo
                </h4>
                <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  {lowStockProducts.length} {lowStockProducts.length === 1 ? 'Producto' : 'Productos'}
                </span>
              </div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                Los siguientes artículos están en o por debajo de su cantidad mínima recomendada:
              </p>

              {/* Lista de productos críticos con píldoras de stock */}
              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                {lowStockProducts.map((lp) => (
                  <span
                    key={lp.id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 text-xs font-black text-rose-600 dark:text-rose-400 shadow-xs"
                  >
                    <span>{lp.name}</span>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md font-black">
                      Quedan: {lp.stock} {lp.unit || 'UND'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ENCABEZADO PROFESIONAL PARA IMPRESIÓN (oculto en pantalla)   */}
      {/* ============================================================ */}
      <div className="hidden print:block print-header-wrap">
        {/* Banda superior con color personalizado del negocio */}
        <div
          className="print-brand-bar"
          style={{
            background: activePrintColor.gradient,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            color: '#ffffff',
            borderRadius: '12px 12px 0 0',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Logo del negocio desde configuración */}
            {activeBusiness?.logo_url ? (
              <img
                src={activeBusiness.logo_url}
                alt="Logo"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '3px solid rgba(255,255,255,0.4)',
                  flexShrink: 0,
                  background: '#fff',
                }}
              />
            ) : (
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.22)',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#fff',
                  flexShrink: 0,
                  border: '3px solid rgba(255,255,255,0.4)',
                } as React.CSSProperties}
              >
                {(activeBusiness?.name || 'K').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                CATÁLOGO OFICIAL · INVENTARIO Y PRODUCTOS
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
                {activeBusiness?.name || 'Mi Negocio'}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
                Reporte de Inventario, Precios y Existencias en Tienda
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.22)',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                color: '#fff',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: 900,
                marginBottom: '4px',
                display: 'inline-block',
                border: '1px solid rgba(255,255,255,0.35)',
              } as React.CSSProperties}
            >
              {sortedProducts.length} ARTÍCULO{sortedProducts.length !== 1 ? 'S' : ''}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', display: 'block' }}>
              {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Franja de información del catálogo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: '#f8fafc',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            border: '1px solid #e2e8f0',
            borderTop: 'none',
            padding: '8px 20px',
            fontSize: '10px',
            color: '#475569',
          } as React.CSSProperties}
        >
          <div>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>INFORMACIÓN DEL CATÁLOGO</span><br />
            Filtro: <strong>Catálogo Completo</strong><br />
            Moneda oficial: <strong>{activeBusiness?.currency === 'USD' ? 'Dólares (USD)' : 'Bolivianos (BOB)'}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>DATOS DE AUDITORÍA</span><br />
            {activeBusiness?.city && <>Ubicación: <strong>{activeBusiness.city}</strong><br /></>}
            Estado: <strong style={{ color: '#10b981' }}>Conectado a Supabase ✓</strong>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE BÚSQUEDA Y FILTROS                              */}
      {/* ======================================================== */}
      <div className="flex items-center gap-3 no-print">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por nombre, código de barra o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        {/* Badge: escáner USB activo */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-black">
          <Barcode className="w-3.5 h-3.5" />
          <span>Lector USB listo</span>
        </div>
        {/* Botón cámara para móvil */}
        <button
          onClick={() => setCameraTarget('search')}
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-95 flex-shrink-0"
          title="Escanear con cámara del celular"
        >
          <Camera className="w-4 h-4" />
        </button>
        <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      </div>

      {/* ======================================================== */}
      {/* TABLA CON FOTO DEL PRODUCTO Y ESTILO DE ALTO CONTRASTE    */}
      {/* ======================================================== */}
      <Card className="p-0 overflow-hidden rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400 font-bold">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando productos de la base de datos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">No se encontraron productos.</p>
            <p className="text-xs mt-1">Comienza agregando los artículos que vendes en tu negocio.</p>
            <Button
              onClick={() => {
                generateSkuCode();
                setIsModalOpen(true);
              }}
              size="sm"
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
            >
              Agregar Primer Producto
            </Button>
          </div>
        ) : (
          <>
            {/* ===== VISTA TARJETAS - solo movil (< lg) ===== */}
            <div className="lg:hidden space-y-2.5">
              {sortedProducts.map((p) => {
                const isLow = Number(p.stock) <= Number(p.min_stock);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${isLow ? 'border-amber-400 dark:border-amber-600 bg-amber-50/60 dark:bg-amber-950/20' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#181615]'}`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden border flex items-center justify-center ${isLow ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800'}`}>
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-zinc-100 leading-tight truncate">{p.name}</span>
                        {isLow && <span className="text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 px-1.5 py-0.5 rounded font-black uppercase flex-shrink-0">Bajo</span>}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono block">{p.sku || p.barcode || 'SIN SKU'}</span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.sale_price, activeBusiness?.currency)}</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${isLow ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'}`}>
                          {p.stock} {p.unit || 'UND'}
                          {isLow && <AlertTriangle className="w-3 h-3 inline ml-1 text-rose-500" />}
                        </span>
                        <Badge variant={p.is_active ? 'emerald' : 'gray'} size="sm">{p.is_active ? 'ACTIVO' : 'INACT.'}</Badge>
                      </div>
                    </div>
                    {!isCashier ? (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => handleOpenEdit(p)} className="w-9 h-9 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 flex items-center justify-center transition-all cursor-pointer active:scale-90" title="Editar">
                          <Edit3 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p)} className="w-9 h-9 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 flex items-center justify-center transition-all cursor-pointer active:scale-90" title="Eliminar">
                          <Trash2 className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium italic flex-shrink-0">Solo lectura</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ===== VISTA TABLA - solo desktop (>= lg) ===== */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-black border-b-2 border-slate-950">
                  <tr>
                    <th className="px-3 py-3 text-left">PRODUCTO</th>
                    <th className="px-2 py-3 text-center whitespace-nowrap">CATEGORIA</th>
                    <th className="px-2 py-3 text-center whitespace-nowrap">CODIGO / SKU</th>
                    <th className="px-2 py-3 text-center whitespace-nowrap">COSTO</th>
                    <th className="px-2 py-3 text-center whitespace-nowrap">PRECIO VENTA</th>
                    <th className="px-2 py-3 text-center whitespace-nowrap">STOCK</th>
                    <th className="px-2 py-3 text-center whitespace-nowrap">ESTADO</th>
                    <th className="px-2 py-3 text-center whitespace-nowrap no-print">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 dark:divide-zinc-800 font-medium">
                  {sortedProducts.map((p) => {
                    const isLow = Number(p.stock) <= Number(p.min_stock);
                    return (
                      <tr key={p.id} className={`transition-colors ${isLow ? 'bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/70' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'}`}>
                        <td className="px-3 py-2.5 text-left align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs border ${isLow ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/50' : 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800'}`}>
                              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-950 dark:text-zinc-100 text-xs">{p.name}</span>
                                {isLow && <span className="text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 px-1.5 rounded font-black uppercase whitespace-nowrap">Bajo</span>}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono block leading-tight">{p.sku || p.barcode || 'SIN CODIGO'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap"><span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-[11px]">{p.category?.name || 'Sin categoria'}</span></td>
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap font-mono text-slate-600 dark:text-zinc-400 font-bold text-[11px]">{p.barcode || p.sku || '-'}</td>
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap font-black text-slate-700 dark:text-zinc-300 text-[11px]">{isCashier ? '-' : formatCurrency(p.cost_price, activeBusiness?.currency)}</td>
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap font-black text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(p.sale_price, activeBusiness?.currency)}</td>
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                            <span className={`font-black text-[11px] ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-zinc-100'}`}>{p.stock} {p.unit || 'UND'}</span>
                            {isLow && <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap"><Badge variant={p.is_active ? 'emerald' : 'gray'} size="sm">{p.is_active ? 'ACTIVO' : 'INACTIVO'}</Badge></td>
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap no-print">
                          {isCashier ? (
                            <span className="text-[10px] text-slate-400 italic">Solo lectura</span>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => handleOpenEdit(p)} className="px-2 py-1 rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-black text-[10px] flex items-center gap-1 transition-all cursor-pointer active:scale-95"><Edit3 className="w-3 h-3 stroke-[2.5]" /><span>Editar</span></button>
                              <button onClick={() => handleDeleteProduct(p)} className="px-2 py-1 rounded-md border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-black text-[10px] flex items-center gap-1 transition-all cursor-pointer active:scale-95"><Trash2 className="w-3 h-3 stroke-[2.5]" /><span>Borrar</span></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ============================================================ */}
      {/* PIE DE PÁGINA PROFESIONAL PARA IMPRESIÓN (oculto en pantalla)*/}
      {/* ============================================================ */}
      <div className="hidden print:block mt-0">
        {/* Resumen de totales: 3 columnas = Logo+Color | QR | Estadísticas */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginTop: '0',
            border: '1px solid #e2e8f0',
            borderTop: 'none',
            padding: '12px 20px',
            background: '#f8fafc',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          } as React.CSSProperties}
        >
          {/* Bloque izquierdo: catálogo certificado CON COLOR */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: activePrintColor.gradient,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              borderRadius: '12px',
              padding: '10px 16px',
              color: '#fff',
              flexShrink: 0,
            } as React.CSSProperties}
          >
            {activeBusiness?.logo_url ? (
              <img
                src={activeBusiness.logo_url}
                alt="Logo"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.4)',
                  background: '#fff',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.4)',
                  flexShrink: 0,
                } as React.CSSProperties}
              >
                {(activeBusiness?.name || 'K').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                CATÁLOGO OFICIAL CERTIFICADO
              </div>
              <div style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff' }}>
                {activeBusiness?.name || 'Mi Negocio'}
              </div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>✓ Registro Oficial de Precios</div>
            </div>
          </div>

          {/* BLOQUE CENTRAL: QR CODE */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '14px',
                padding: '10px',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              } as React.CSSProperties}
            >
              <QRCodeSVG
                value={getCatalogQrUrl()}
                size={82}
                fgColor="#000000"
                bgColor="#ffffff"
                level="M"
              />
              <div style={{ fontSize: '7px', fontWeight: 800, color: '#64748b', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
                📲 Ver Catálogo Online
              </div>
            </div>
          </div>

          {/* Bloque derecho: estadísticas */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 18px',
              minWidth: '220px',
              textAlign: 'right',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            } as React.CSSProperties}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
              <span>Artículos en catálogo:</span>
              <strong style={{ color: '#1e293b' }}>{sortedProducts.length} productos</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
              <span>Unidades en existencia:</span>
              <strong style={{ color: '#1e293b' }}>
                {sortedProducts.reduce((acc, p) => acc + Number(p.stock), 0)} uds.
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>
              <span>Valor de costo (compra):</span>
              <strong style={{ color: '#1e293b' }}>
                {formatCurrency(sortedProducts.reduce((acc, p) => acc + (Number(p.cost_price) * Number(p.stock)), 0), activeBusiness?.currency)}
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 900,
                color: '#fff',
                background: activePrintColor.gradient,
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                borderRadius: '7px',
                padding: '6px 10px',
              } as React.CSSProperties}
            >
              <span>VALOR TOTAL VENTA:</span>
              <span style={{ color: '#ffffff' }}>
                {formatCurrency(sortedProducts.reduce((acc, p) => acc + (Number(p.sale_price) * Number(p.stock)), 0), activeBusiness?.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Nota al pie */}
        <div style={{ textAlign: 'center', fontSize: '9px', color: '#94a3b8', padding: '8px 0 4px', borderTop: '1px solid #e2e8f0' }}>
          Catálogo y lista de precios emitido por el Sistema Komerz POS · Calidad y Precios Garantizados
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL HORIZONTAL: REGISTRAR NUEVO PRODUCTO              */}
      {/* ======================================================== */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Registrar Nuevo Producto"
          className="max-w-4xl"
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs text-rose-700 font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="p-2 sm:p-3 space-y-5">
            {/* Disposición Horizontal en 2 Columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: FOTO Y CAJA DE PRECIOS */}
              <div className="space-y-4">
                {/* 1. Foto del Producto desde Dispositivo */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-2">
                    Foto del Producto (Desde dispositivo)
                  </label>
                  <div className="flex items-center gap-3.5">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-inner">
                      {productImage ? (
                        <>
                          <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductImage(null)}
                            className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mb-0.5" />
                            Quitar
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 hover:border-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-black flex items-center gap-2 bg-white dark:bg-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Cargar Imagen</span>
                      </button>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 leading-tight">
                        PNG, JPG o WEBP (se optimiza automáticamente).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Caja Agrupada de Moneda y Precios */}
                <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-850/60 p-4 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      Moneda del Producto
                    </span>
                    <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setProductCurrency('BOB')}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          productCurrency === 'BOB'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        🇧🇴 Bs (Bolivianos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductCurrency('USD')}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          productCurrency === 'USD'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        💵 $ (Dólares)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1">
                        Precio Compra ({productCurrency === 'BOB' ? 'Bs' : '$'}) <span className="font-normal text-[10px] text-slate-400">(Opcional)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1">
                        Precio Venta ({productCurrency === 'BOB' ? 'Bs' : '$'}) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-black rounded-xl border-2 border-emerald-300 dark:border-emerald-800 px-3 py-2.5 focus:outline-none focus:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Categoría (Opcional)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 p-2.5"
                  >
                    <option value="">Selecciona una categoría...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COLUMNA DERECHA: CÓDIGO DE BARRAS, SKU, NOMBRE, DESCRIPCIÓN Y STOCK */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1.5">
                      Código de Barras <span className="font-normal text-[10px] text-slate-400">(Escaneado)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Ej: 7771214001109"
                        className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setCameraTarget('create')}
                        className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-600/25 transition-all cursor-pointer active:scale-95 flex-shrink-0"
                        title="Escanear código de barras con cámara"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black text-slate-800 dark:text-zinc-200">
                        SKU Interno
                      </label>
                      <button
                        type="button"
                        onClick={generateSkuCode}
                        className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Dices className="w-3.5 h-3.5" />
                        <span>Generar</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="PROD-3400"
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Mouse Inalámbrico Logitech"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Descripción <span className="font-normal text-[10px] text-slate-400">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Detalles breves del artículo"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="5"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES INFERIORES */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL HORIZONTAL: EDITAR PRODUCTO                        */}
      {/* ======================================================== */}
      {editingProduct && (
        <Modal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          title={`Editar Producto: ${editingProduct.name}`}
          className="max-w-4xl"
        >
          {editError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs text-rose-700 font-bold">
              {editError}
            </div>
          )}

          <form onSubmit={handleUpdateProduct} className="p-2 sm:p-3 space-y-5">
            {/* Disposición Horizontal en 2 Columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: FOTO Y CAJA DE PRECIOS */}
              <div className="space-y-4">
                {/* 1. Foto del Producto */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-2">
                    Foto del Producto (Desde dispositivo)
                  </label>
                  <div className="flex items-center gap-3.5">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-inner">
                      {editProductImage ? (
                        <>
                          <img src={editProductImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditProductImage(null)}
                            className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mb-0.5" />
                            Quitar
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={editFileInputRef}
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleEditImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 hover:border-emerald-600 text-slate-700 dark:text-zinc-200 text-xs font-black flex items-center gap-2 bg-white dark:bg-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Cambiar Imagen</span>
                      </button>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 leading-tight">
                        PNG, JPG o WEBP (se optimiza automáticamente).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Caja Agrupada de Moneda y Precios */}
                <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-855/60 p-4 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      Moneda del Producto
                    </span>
                    <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEditProductCurrency('BOB')}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          editProductCurrency === 'BOB'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        🇧🇴 Bs (Bolivianos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditProductCurrency('USD')}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          editProductCurrency === 'USD'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        💵 $ (Dólares)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1">
                        Precio Compra ({editProductCurrency === 'BOB' ? 'Bs' : '$'}) <span className="font-normal text-[10px] text-slate-400">(Opcional)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={editCostPrice}
                        onChange={(e) => setEditCostPrice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1">
                        Precio Venta ({editProductCurrency === 'BOB' ? 'Bs' : '$'}) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={editSalePrice}
                        onChange={(e) => setEditSalePrice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-black rounded-xl border-2 border-emerald-300 dark:border-emerald-800 px-3 py-2.5 focus:outline-none focus:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Categoría (Opcional)
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 p-2.5"
                  >
                    <option value="">Selecciona una categoría...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COLUMNA DERECHA: SKU, NOMBRE, DESCRIPCIÓN Y STOCK */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      Código de Barra / SKU
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Generar nuevo</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    placeholder="PROD-3400"
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Mouse Inalámbrico Logitech"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Código de Barra Alternativo <span className="font-normal text-[10px] text-slate-400">(Opcional)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Código EAN / UPC numérico"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setCameraTarget('edit')}
                      className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shadow-blue-600/25 transition-all cursor-pointer active:scale-95 flex-shrink-0"
                      title="Escanear código de barras con cámara"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-black text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="5"
                      value={editMinStock}
                      onChange={(e) => setEditMinStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-600 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES INFERIORES */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-6 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-8 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {updating ? 'Actualizando...' : 'Actualizar Producto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal cámara para escaneo móvil */}
      <BarcodeCameraModal
        isOpen={isCameraOpen}
        onClose={() => setCameraTarget(null)}
        onScan={(code) => {
          const target = cameraTarget || 'search';
          setCameraTarget(null);
          handleModalCameraScan(code, target);
        }}
        title={
          cameraTarget === 'create'
            ? 'Escanear → Nuevo Producto'
            : cameraTarget === 'edit'
            ? 'Escanear → Editar Producto'
            : 'Escanear → Producto'
        }
      />
    </div>
  );
};
