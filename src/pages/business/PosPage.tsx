import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ArrowRight,
  CheckCircle2,
  Package,
  Receipt,
  User,
  Calendar,
  QrCode,
  Smartphone,
  Sparkles,
  AlertTriangle,
  Store,
  X,
  Upload,
  Image as ImageIcon,
  Dices,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatFullDate } from '@/utils/formatters';
import type { Product } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosPage: React.FC = () => {
  const { activeBusiness, settings, mainBranch } = useBusiness();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerNit, setCustomerNit] = useState('');
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Modo de Impuesto en POS:
  // 'included': Precio del producto es el precio final que paga el cliente (Default retail)
  // 'added': Suma el impuesto encima del precio
  // 'none': Sin impuesto (0%)
  const [taxMode, setTaxMode] = useState<'included' | 'added' | 'none'>('included');

  // Quick modals state (Nuevo Producto Horizontal)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdSku, setNewProdSku] = useState('PROD-3400');
  const [newProdCurrency, setNewProdCurrency] = useState<'BOB' | 'USD'>('BOB');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('0');
  const [newProdMinStock, setNewProdMinStock] = useState('5');
  const [newProdImage, setNewProdImage] = useState<string | null>(null);
  const [savingNewProd, setSavingNewProd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSkuCode = () => {
    const code = `PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewProdSku(code);
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
      setNewProdImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Quick Stock adjustment modal state
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockToAdd, setStockToAdd] = useState('10');
  const [savingStock, setSavingStock] = useState(false);

  const currency = activeBusiness?.currency || 'BOB';

  const fetchCatalog = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('business_id', activeBusiness.id)
          .order('name', { ascending: true })
      ]);

      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching POS products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [activeBusiness]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`El producto "${product.name}" está agotado.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`No puedes agregar más de ${product.stock} unidades de este producto.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQ = item.quantity + delta;
            if (newQ > item.product.stock) {
              alert(`Stock máximo disponible: ${item.product.stock}`);
              return item;
            }
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cálculos transparentes de Totales e Impuestos
  const taxPercentage = settings?.tax_percentage ?? 0;
  const taxRate = taxPercentage / 100;

  const rawCartSum = cart.reduce(
    (acc, item) => acc + item.product.sale_price * item.quantity,
    0
  );

  let subtotal = rawCartSum;
  let taxAmount = 0;
  let total = rawCartSum;

  if (taxMode === 'included') {
    // Modo estándar retail: El precio fijado en el producto es el total a pagar
    total = rawCartSum;
    if (taxRate > 0) {
      subtotal = Number((total / (1 + taxRate)).toFixed(2));
      taxAmount = Number((total - subtotal).toFixed(2));
    } else {
      subtotal = total;
      taxAmount = 0;
    }
  } else if (taxMode === 'added') {
    // Suma impuesto encima del precio
    subtotal = rawCartSum;
    taxAmount = Number((subtotal * taxRate).toFixed(2));
    total = Number((subtotal + taxAmount).toFixed(2));
  } else {
    // Sin impuesto
    subtotal = rawCartSum;
    taxAmount = 0;
    total = rawCartSum;
  }

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (!activeBusiness || cart.length === 0) return;

    try {
      setProcessing(true);
      const invoiceNumber = `${settings?.invoice_prefix || 'FAC-'}${Date.now().toString().slice(-6)}`;

      // 1. Create sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: activeBusiness.id,
          branch_id: mainBranch?.id || null,
          user_id: user?.id || null,
          invoice_number: invoiceNumber,
          subtotal,
          tax: taxAmount,
          total,
          payment_method: paymentMethod,
          status: 'completed',
        })
        .select()
        .single();

      if (saleError || !saleData) throw saleError || new Error('Error al registrar venta');

      // 2. Create sale items & reduce stock
      for (const item of cart) {
        await supabase.from('sale_items').insert({
          sale_id: saleData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.sale_price,
          total_price: item.product.sale_price * item.quantity,
        });

        // Reduce stock in products table
        await supabase
          .from('products')
          .update({
            stock: Math.max(0, item.product.stock - item.quantity),
          })
          .eq('id', item.product.id);
      }

      // 3. Log audit event
      await supabase.from('audit_logs').insert({
        business_id: activeBusiness.id,
        user_id: user?.id || null,
        action: 'CREATE_SALE',
        entity: 'sales',
        details: {
          invoice_number: invoiceNumber,
          total,
          items_count: cart.length,
          customer_name: customerName,
          customer_nit: customerNit,
        },
      });

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
      });

      const changeAmount = amountPaid && parseFloat(amountPaid) >= total ? parseFloat(amountPaid) - total : 0;
      setCompletedSale({
        ...saleData,
        items: cart,
        paid: amountPaid ? parseFloat(amountPaid) : total,
        change: changeAmount,
        customerName,
        customerNit,
      });

      // Reset
      setCart([]);
      setAmountPaid('');
      setCustomerName('Consumidor Final');
      setCustomerNit('');
      fetchCatalog();
    } catch (err: any) {
      alert(`Error al procesar la venta: ${err?.message || 'Error desconocido'}`);
    } finally {
      setProcessing(false);
    }
  };

  // Quick Create Product (con Soporte de Imagen, Moneda y SKU Generado)
  const handleQuickCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !newProdName.trim() || !newProdPrice) return;

    try {
      setSavingNewProd(true);
      const generatedSku = newProdSku.trim() || `PROD-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error } = await supabase
        .from('products')
        .insert({
          business_id: activeBusiness.id,
          name: newProdName.trim(),
          sale_price: parseFloat(newProdPrice) || 0,
          cost_price: parseFloat(newProdCost) || 0,
          stock: parseFloat(newProdStock) || 0,
          sku: generatedSku,
          min_stock: parseFloat(newProdMinStock) || 5,
          image_url: newProdImage || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setIsNewProductModalOpen(false);
      setNewProdName('');
      setNewProdDescription('');
      setNewProdPrice('');
      setNewProdCost('');
      setNewProdStock('0');
      setNewProdMinStock('5');
      setNewProdImage(null);
      generateSkuCode();

      await fetchCatalog();
      if (data) {
        addToCart(data as Product);
      }
    } catch (err: any) {
      alert(`Error al crear producto: ${err.message}`);
    } finally {
      setSavingNewProd(false);
    }
  };

  // Quick Add Stock
  const handleQuickAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;

    try {
      setSavingStock(true);
      const addQty = parseInt(stockToAdd, 10) || 0;
      if (addQty <= 0) return;

      const newTotal = stockModalProduct.stock + addQty;
      const { error } = await supabase
        .from('products')
        .update({ stock: newTotal })
        .eq('id', stockModalProduct.id);

      if (error) throw error;

      setStockModalProduct(null);
      setStockToAdd('10');
      await fetchCatalog();
    } catch (err: any) {
      alert(`Error al actualizar stock: ${err.message}`);
    } finally {
      setSavingStock(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* ======================================================== */}
      {/* CABECERA SUPERIOR: TÍTULO, SUBTÍTULO Y FECHA             */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/25">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Punto de Venta (POS)
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
              Registro ágil de pedidos, cálculo de cobros y emisión de facturas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400 bg-white dark:bg-[#181615] px-4 py-2 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 shadow-sm">
          <Calendar className="w-4 h-4 text-rose-500" />
          <span>{formatFullDate()}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CUERPO PRINCIPAL: CATÁLOGO DE PRODUCTOS + CARRITO        */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LADO IZQUIERDO: CATÁLOGO CON TARJETAS VISUALES */}
        <div className="flex-1 w-full space-y-3.5 min-w-0">
          {/* Barra de Búsqueda y Botón "+ Nuevo Producto" */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, código de barra o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#181615] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-sm font-bold pl-11 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsNewProductModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nuevo Producto</span>
            </button>
          </div>

          {/* Barra de Filtro de Categorías */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-white dark:bg-[#181615] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.map((c) => {
                const count = products.filter((p) => p.category_id === c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === c.id
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'bg-white dark:bg-[#181615] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Grilla de Tarjetas de Productos Cuadraditas y Proporcionadas */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-black text-slate-500">Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-dashed border-slate-300 dark:border-zinc-800 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-black text-slate-800 dark:text-zinc-200">
                No se encontraron productos
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">
                {search ? 'Intenta con otro término de búsqueda' : 'Registra tus primeros artículos con el botón "+ Nuevo Producto"'}
              </p>
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-500 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Producto Ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 items-start">
              {filteredProducts.map((product) => {
                const inCartItem = cart.find((c) => c.product.id === product.id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className={`bg-white dark:bg-[#181615] rounded-2xl border-2 transition-all duration-200 p-3.5 flex flex-col justify-between shadow-md hover:shadow-xl ${
                      inCartItem
                        ? 'border-emerald-500 dark:border-emerald-500/80 shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                        : 'border-slate-300 dark:border-zinc-700 hover:border-emerald-500'
                    }`}
                  >
                    <div>
                      {/* Imagen o Foto del Producto Cuadrada/Proporcionada */}
                      <div className="h-28 w-full rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50/40 via-slate-100 to-teal-50/30 dark:from-zinc-800 dark:to-zinc-900 mb-2.5 flex items-center justify-center relative border border-slate-200 dark:border-zinc-700 group">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                            <Store className="w-9 h-9 opacity-40 mb-0.5 text-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                              Komi POS
                            </span>
                          </div>
                        )}

                        {/* Indicador de en carrito flotante */}
                        {inCartItem && (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                            <ShoppingCart className="w-3 h-3" />
                            <span>{inCartItem.quantity}</span>
                          </span>
                        )}
                      </div>

                      {/* Fila de Badges: SKU + Stock sin truncarse */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                          {product.sku || product.barcode || `PROD-${product.id.slice(0, 4)}`}
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              : product.stock <= (product.min_stock || 5)
                              ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          Stock: {product.stock}
                        </span>
                      </div>

                      {/* Nombre del Producto */}
                      <h4 className="text-sm font-black text-slate-950 dark:text-zinc-100 line-clamp-1 mt-2 leading-tight" title={product.name}>
                        {product.name}
                      </h4>

                      {/* Precio Destacado */}
                      <p className="text-lg font-black text-slate-950 dark:text-white mt-1">
                        {formatCurrency(product.sale_price, currency)}
                      </p>
                    </div>

                    {/* Botones de Acción al pie de la tarjeta */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setStockModalProduct(product);
                          setStockToAdd('10');
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-black rounded-lg border-2 border-slate-300 dark:border-zinc-700 hover:border-slate-500 dark:hover:border-zinc-500 text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                        title="Ajustar o agregar stock"
                      >
                        + Stock
                      </button>

                      {inCartItem ? (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>En carrito ({inCartItem.quantity}) +</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product)}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/20'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Vender</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* LADO DERECHO: PANEL CARRITO DE VENTA ERGONÓMICO          */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[380px] xl:w-[410px] bg-white dark:bg-[#181615] rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-95px)] sticky top-3 flex-shrink-0">
          {/* 1. Cabecera Fija del Carrito */}
          <div className="bg-slate-900 text-white px-4 py-3 border-b-2 border-slate-950 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-white tracking-tight">
                Carrito de Venta
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs font-black text-rose-400 hover:text-rose-300 hover:underline transition-colors cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* 2. Cuerpo Scrollable: Lista de Productos y Datos de Cliente */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-0">
            {cart.length === 0 ? (
              <div className="py-14 text-center text-slate-400 dark:text-zinc-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  El carrito está vacío
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                  Toca los productos para agregarlos a la venta
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center gap-2.5"
                  >
                    {/* Miniatura */}
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    {/* Detalle y Cantidad */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
                          {item.product.name}
                        </p>
                        <span className="text-xs font-black text-slate-950 dark:text-white whitespace-nowrap">
                          {formatCurrency(item.product.sale_price * item.quantity, currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
                        <p className="text-[10px] font-bold text-slate-400">
                          {formatCurrency(item.product.sale_price, currency)} c/u
                        </p>

                        {/* Stepper de Cantidad */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-5 h-5 rounded bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-800 dark:text-zinc-200 flex items-center justify-center font-black text-xs transition-colors cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                          <span className="w-5 text-center text-xs font-black text-slate-900 dark:text-zinc-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black text-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                            title="Quitar producto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Datos de Cliente (Compacto y Desplegable para no robar espacio) */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCustomerFields((prev) => !prev)}
                className="w-full flex items-center justify-between text-left text-[11px] font-black text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cliente: <strong className="text-slate-900 dark:text-zinc-100">{customerName}</strong></span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold underline">
                  {showCustomerFields ? 'Ocultar' : 'Editar / Factura'}
                </span>
              </button>

              {showCustomerFields && (
                <div className="grid grid-cols-2 gap-2 pt-2 animate-fadeIn">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-0.5">
                      Nombre / Razón Social
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Consumidor Final"
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-0.5">
                      NIT / CI
                    </label>
                    <input
                      type="text"
                      value={customerNit}
                      onChange={(e) => setCustomerNit(e.target.value)}
                      placeholder="ej. 8493021"
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Footer Fijo de Cobro: Totales, Métodos y Botón SIEMPRE VISIBLE */}
          <div className="p-3.5 border-t-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/90 flex-shrink-0 space-y-2">
            
            {/* Desglose de Subtotal y Selector de Impuesto */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 font-bold">
                <span>Subtotal ({totalItemsCount} unid.):</span>
                <span className="font-mono text-slate-800 dark:text-zinc-200 font-black">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>

              {/* Selector de Impuesto Transparente */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 dark:text-zinc-400">Impuesto:</span>
                  <div className="inline-flex rounded-md p-0.5 bg-slate-200 dark:bg-zinc-800 text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setTaxMode('included')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        taxMode === 'included'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                      }`}
                      title="El precio del producto ya incluye el impuesto (Cobro exacto)"
                    >
                      IVA Inc.
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('none')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        taxMode === 'none'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                      }`}
                      title="Sin impuesto (0%)"
                    >
                      0%
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('added')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        taxMode === 'added'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                      }`}
                      title="Sumar impuesto adicional encima del precio"
                    >
                      +{taxPercentage}%
                    </button>
                  </div>
                </div>

                <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                  {taxMode === 'added'
                    ? `+${formatCurrency(taxAmount, currency)}`
                    : taxMode === 'included' && taxAmount > 0
                    ? `(${formatCurrency(taxAmount, currency)} inc.)`
                    : formatCurrency(0, currency)}
                </span>
              </div>
            </div>

            {/* Total Destacado a Cobrar */}
            <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-700/80 flex items-baseline justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Total a cobrar:
              </span>
              <span className="text-2xl font-black text-slate-950 dark:text-white">
                {formatCurrency(total, currency)}
              </span>
            </div>

            {/* Selector de Método de Pago Compacto */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: 'Efectivo', icon: Banknote },
                { id: 'transfer', label: 'QR / Trans.', icon: Smartphone },
                { id: 'card', label: 'Tarjeta', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-1.5 px-2 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-black text-xs ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Calculadora de Efectivo, Billetes Rápidos y Vuelto */}
            {paymentMethod === 'cash' && cart.length > 0 && (
              <div className="bg-white dark:bg-zinc-850 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="any"
                      placeholder={total.toFixed(2)}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-black px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-600 focus:outline-none focus:border-emerald-500 text-right pr-2"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setAmountPaid(total.toFixed(2))}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-800 dark:text-zinc-200 text-[11px] font-black rounded-lg transition-colors cursor-pointer"
                  >
                    Exacto
                  </button>

                  {/* Billetes rápidos */}
                  {[50, 100, 200].filter(v => v >= total).slice(0, 2).map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setAmountPaid(bill.toFixed(2))}
                      className="px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      {bill}
                    </button>
                  ))}
                </div>

                {amountPaid && parseFloat(amountPaid) >= total && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-black">
                    <span>Cambio / Vuelto:</span>
                    <span className="text-sm font-black">
                      {formatCurrency(parseFloat(amountPaid) - total, currency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Botón Principal: Cobrar Venta (SIEMPRE VISIBLE) */}
            <button
              type="button"
              disabled={cart.length === 0 || processing}
              onClick={handleCheckout}
              className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                cart.length === 0 || processing
                  ? 'bg-slate-300 dark:bg-zinc-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-98'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {processing
                  ? 'Procesando Venta...'
                  : cart.length === 0
                  ? 'Carrito Vacío'
                  : `Cobrar ${formatCurrency(total, currency)}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR NUEVO PRODUCTO (DISEÑO HORIZONTAL)      */}
      {/* ======================================================== */}
      {isNewProductModalOpen && (
        <Modal
          isOpen={isNewProductModalOpen}
          onClose={() => setIsNewProductModalOpen(false)}
          title="Registrar Nuevo Producto"
          className="max-w-4xl"
        >
          <form onSubmit={handleQuickCreateProduct} className="p-2 sm:p-3 space-y-5">
            {/* Disposición Horizontal en 2 Columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: FOTO Y CAJA DE PRECIOS CON MONEDA */}
              <div className="space-y-4">
                {/* 1. Foto del Producto */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-2">
                    Foto del Producto (Desde dispositivo)
                  </label>
                  <div className="flex items-center gap-3.5">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-inner">
                      {newProdImage ? (
                        <>
                          <img src={newProdImage} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewProdImage(null)}
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
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 hover:border-emerald-500 text-slate-700 dark:text-zinc-200 text-xs font-black flex items-center gap-2 bg-white dark:bg-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
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
                  {/* Selector de Moneda */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      Moneda del Producto
                    </span>
                    <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setNewProdCurrency('BOB')}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          newProdCurrency === 'BOB'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        🇧🇴 Bs (Bolivianos)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdCurrency('USD')}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          newProdCurrency === 'USD'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        💵 $ (Dólares)
                      </button>
                    </div>
                  </div>

                  {/* Precios Compra y Venta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1">
                        Precio Compra ({newProdCurrency === 'BOB' ? 'Bs' : '$'}) <span className="font-normal text-[10px] text-slate-400">(Opcional)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-zinc-300 mb-1">
                        Precio Venta ({newProdCurrency === 'BOB' ? 'Bs' : '$'}) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-black rounded-xl border-2 border-emerald-300 dark:border-emerald-800 px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: CÓDIGO/SKU, NOMBRE, DESCRIPCIÓN Y STOCK */}
              <div className="space-y-3.5">
                {/* 1. Código de Barra / SKU con botón Generar Código */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      Código de Barra / SKU (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={generateSkuCode}
                      className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Generar código</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="PROD-3400"
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Si no tienes un código de barras, se asignará uno automáticamente.
                  </p>
                </div>

                {/* 2. Nombre del Producto */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Mouse Inalámbrico Logitech"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3. Descripción (Opcional) */}
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                    Descripción <span className="font-normal text-[10px] text-slate-400">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Detalles breves del artículo"
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 4. Stock Inicial y Stock Mínimo */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500"
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
                      value={newProdMinStock}
                      onChange={(e) => setNewProdMinStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES INFERIORES: CANCELAR Y GUARDAR */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingNewProd}
                className="px-8 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {savingNewProd ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: AJUSTE RÁPIDO DE STOCK                            */}
      {/* ======================================================== */}
      {stockModalProduct && (
        <Modal
          isOpen={Boolean(stockModalProduct)}
          onClose={() => setStockModalProduct(null)}
          title={`Agregar Stock — ${stockModalProduct.name}`}
        >
          <form onSubmit={handleQuickAddStock} className="p-4 space-y-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-zinc-100">
                  {stockModalProduct.name}
                </p>
                <p className="text-[10px] font-bold text-slate-500">
                  SKU: {stockModalProduct.sku || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Stock Actual</span>
                <span className="text-base font-black text-emerald-600">
                  {stockModalProduct.stock} unidades
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Cantidad a Agregar:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm font-black rounded-xl border border-slate-300 dark:border-zinc-700 p-2.5 focus:outline-none focus:border-emerald-500 text-center"
                />
              </div>

              {/* Botones de incremento rápido */}
              <div className="flex items-center gap-2 mt-2">
                {[5, 10, 20, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStockToAdd(val.toString())}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-colors"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingStock}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md"
              >
                {savingStock ? 'Guardando...' : 'Confirmar Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: VENTA REALIZADA CON ÉXITO                         */}
      {/* ======================================================== */}
      {completedSale && (
        <Modal
          isOpen={Boolean(completedSale)}
          onClose={() => setCompletedSale(null)}
          title="¡Venta Realizada con Éxito!"
        >
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h4 className="text-2xl font-black text-slate-900 dark:text-zinc-100">
              {formatCurrency(completedSale.total, currency)}
            </h4>

            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Comprobante Nº:{' '}
              <span className="font-mono font-black text-slate-800 dark:text-zinc-200">
                {completedSale.invoice_number}
              </span>
            </p>

            <div className="p-3 bg-slate-50 dark:bg-zinc-850 rounded-2xl text-xs space-y-1.5 text-left max-w-xs mx-auto border border-slate-200 dark:border-zinc-700 font-bold">
              <div className="flex justify-between text-slate-500">
                <span>Cliente:</span>
                <span className="text-slate-800 dark:text-zinc-200">{completedSale.customerName || 'Consumidor Final'}</span>
              </div>
              {completedSale.customerNit && (
                <div className="flex justify-between text-slate-500">
                  <span>NIT / CI:</span>
                  <span className="text-slate-800 dark:text-zinc-200">{completedSale.customerNit}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Método de Pago:</span>
                <span className="text-slate-800 dark:text-zinc-200 uppercase">{completedSale.payment_method}</span>
              </div>
              {completedSale.payment_method === 'cash' && completedSale.paid > 0 && (
                <>
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200 dark:border-zinc-700">
                    <span>Efectivo recibido:</span>
                    <span>{formatCurrency(completedSale.paid, currency)}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-600 dark:text-emerald-400">
                    <span>Devuelta / Vuelto:</span>
                    <span>{formatCurrency(completedSale.change, currency)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Imprimir Ticket
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-colors cursor-pointer"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
