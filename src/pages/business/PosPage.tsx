import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Printer,
  ChevronDown,
  ChevronUp,
  Camera,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatFullDate } from '@/utils/formatters';
import type { Product, BusinessType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { BusinessModeBar } from '@/components/pos/BusinessModeBar';
import { ScaleModal } from '@/components/pos/ScaleModal';
import { ClothingVariantModal } from '@/components/pos/ClothingVariantModal';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { BarcodeCameraModal } from '@/components/common/BarcodeCameraModal';
import { ScanResultCard, type ScanResultData } from '@/components/common/ScanResultCard';
import { lookupBarcodeOnline } from '@/utils/barcodeLookup';

interface CartItem {
  product: Product;
  quantity: number;
  weightKg?: number;
  variant?: {
    size?: string;
    color?: string;
  };
  tableNumber?: string;
  notes?: string;
}

export const PosPage: React.FC = () => {
  const { activeBusiness, settings, mainBranch, activeMembership, updateSettings } = useBusiness();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Giro / Tipo de negocio activo con detección inteligente
  const businessType: BusinessType | string = useMemo(() => {
    if (activeBusiness?.business_type) return activeBusiness.business_type;
    const n = (activeBusiness?.name || '').toLowerCase();
    if (n.includes('carniseria') || n.includes('carniceria') || n.includes('frigorifico')) return 'butchery';
    if (n.includes('farma') || n.includes('drogueria')) return 'pharmacy';
    if (n.includes('rest') || n.includes('cafe') || n.includes('comida')) return 'restaurant';
    if (n.includes('ropa') || n.includes('boutique') || n.includes('calzado')) return 'clothing';
    if (n.includes('panad') || n.includes('pastel')) return 'bakery';
    if (n.includes('helad')) return 'icecream';
    if (n.includes('ferret')) return 'hardware';
    return 'retail';
  }, [activeBusiness?.business_type, activeBusiness?.name]);

  // Estados de Adaptación por Negocio
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [pendingScaleProduct, setPendingScaleProduct] = useState<Product | null>(null);

  const [selectedTable, setSelectedTable] = useState('Mesa 1');

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isClothingModalOpen, setIsClothingModalOpen] = useState(false);
  const [pendingClothingProduct, setPendingClothingProduct] = useState<Product | null>(null);

  const [selectedUnit, setSelectedUnit] = useState('UND');
  const [packDiscountActive, setPackDiscountActive] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerNit, setCustomerNit] = useState('');
  const [availableCustomers, setAvailableCustomers] = useState<{ id: string; name: string; identification: string | null }[]>([]);
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [showTaxDrawer, setShowTaxDrawer] = useState(false);
  const [showDiscountDrawer, setShowDiscountDrawer] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // ---- DESCUENTO ----
  // discountType: 'percent' = % del subtotal | 'fixed' = monto fijo directo
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<string>('');

  // Modo de Impuesto en POS:
  // 'none': Sin IVA (0% - No tiene / Exento)
  // 'included': Con IVA incluido en precio (Cobro exacto de vitrina)
  // 'added': Con IVA adicional (+% suma encima del precio)
  const [taxMode, setTaxMode] = useState<'included' | 'added' | 'none'>(() => {
    const saved = localStorage.getItem('komipos_tax_mode');
    if (saved === 'none' || saved === 'included' || saved === 'added') return saved;
    return 'none';
  });

  // Porcentaje (%) de IVA configurable por el comerciante:
  const [taxPercentage, setTaxPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('komipos_tax_percentage');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return settings?.tax_percentage ?? 13;
  });

  useEffect(() => {
    if (settings?.tax_percentage !== undefined && settings.tax_percentage !== null) {
      setTaxPercentage(settings.tax_percentage);
    }
  }, [settings?.tax_percentage]);

  useEffect(() => {
    localStorage.setItem('komipos_tax_mode', taxMode);
  }, [taxMode]);

  const handleTaxPercentageChange = (val: number) => {
    const safeVal = Math.max(0, Math.min(100, Math.round(val * 10) / 10));
    setTaxPercentage(safeVal);
    localStorage.setItem('komipos_tax_percentage', safeVal.toString());
    if (updateSettings) {
      updateSettings({ tax_percentage: safeVal }).catch(console.error);
    }
  };

  // Quick modals state (Nuevo Producto Horizontal)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
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
      const [prodRes, catRes, custRes] = await Promise.all([
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
          .order('name', { ascending: true }),
        supabase
          .from('customers')
          .select('id, name, identification')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('name', { ascending: true })
      ]);

      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data);
      if (custRes.data) setAvailableCustomers(custRes.data);
    } catch (err) {
      console.error('Error fetching POS products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [activeBusiness]);

  const handleProductSelect = (product: Product) => {
    if (product.stock <= 0) {
      alert(`El producto "${product.name}" está agotado.`);
      return;
    }

    // Modo Carnicería / Frigorífico: Pesaje por balanza
    if (businessType === 'butchery') {
      if (selectedWeight && selectedWeight > 0) {
        addWithCustomProps(product, { weightKg: selectedWeight });
      } else {
        setPendingScaleProduct(product);
        setIsScaleModalOpen(true);
      }
      return;
    }

    // Modo Ropa / Calzado: Selector de Tallas y Colores
    if (businessType === 'clothing') {
      if (selectedSize || selectedColor) {
        addWithCustomProps(product, {
          variant: { size: selectedSize || 'M', color: selectedColor || 'Negro' },
        });
      } else {
        setPendingClothingProduct(product);
        setIsClothingModalOpen(true);
      }
      return;
    }

    // Modo Restaurante: Asignar a la mesa actual
    if (businessType === 'restaurant') {
      addWithCustomProps(product, { tableNumber: selectedTable });
      return;
    }

    addToCart(product);
  };

  const addWithCustomProps = (
    product: Product,
    props: {
      weightKg?: number;
      variant?: { size?: string; color?: string };
      tableNumber?: string;
      notes?: string;
    }
  ) => {
    setCart((prev) => [
      ...prev,
      {
        product,
        quantity: 1,
        weightKg: props.weightKg,
        variant: props.variant,
        tableNumber: props.tableNumber || selectedTable,
        notes: props.notes,
      },
    ]);
  };

  const handlePrintKitchenOrder = () => {
    if (cart.length === 0) return;
    const win = window.open('', '_blank', 'width=340,height=600');
    if (!win) return;
    const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Comanda Cocina - ${selectedTable}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 13px; width: 72mm; margin: 4mm auto; color: #000; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .title { font-size: 18px; font-weight: bold; }
          .table { font-size: 22px; font-weight: 900; margin: 4px 0; background: #000; color: #fff; padding: 2px 6px; display: inline-block; border-radius: 4px; }
          .item { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 6px 0; border-bottom: 1px dotted #ccc; padding-bottom: 3px; }
          .qty { font-size: 16px; font-weight: 900; margin-right: 8px; }
          .footer { margin-top: 12px; border-top: 2px dashed #000; text-align: center; font-size: 11px; padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🍳 COMANDA A COCINA</div>
          <div class="table">${selectedTable.toUpperCase()}</div>
          <div>Hora: ${timeStr} | Fecha: ${dateStr}</div>
          <div>Cajero: ${user?.email || 'Turno Activo'}</div>
        </div>
        <div class="items">
          ${cart.map((item) => `
            <div class="item">
              <span><span class="qty">${item.quantity}x</span>${item.product.name} ${item.variant ? `(${item.variant.size || ''} ${item.variant.color || ''})` : ''} ${item.notes ? `[${item.notes}]` : ''}</span>
            </div>
          `).join('')}
        </div>
        <div class="footer">
          *** ORDEN EN PREPARACIÓN ***
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`El producto "${product.name}" está agotado.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && !item.weightKg && !item.variant);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`No puedes agregar más de ${product.stock} unidades de este producto.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id && !item.weightKg && !item.variant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, tableNumber: selectedTable }];
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

  // Cálculos transparentes de Totales e Impuestos con soporte para Pesaje y Packs
  const effectiveTaxRate = taxMode === 'none' ? 0 : taxPercentage / 100;

  const rawCartSum = cart.reduce((acc, item) => {
    const itemTotal = item.weightKg
      ? item.product.sale_price * item.weightKg
      : item.product.sale_price * item.quantity;
    return acc + (packDiscountActive ? itemTotal * 0.9 : itemTotal);
  }, 0);

  // Calcular monto de descuento
  const discountNumeric = parseFloat(discountValue) || 0;
  const discountAmount = discountValue && discountNumeric > 0
    ? discountType === 'percent'
      ? Number((rawCartSum * Math.min(discountNumeric, 100) / 100).toFixed(2))
      : Number(Math.min(discountNumeric, rawCartSum).toFixed(2))
    : 0;
  const baseAfterDiscount = Number((rawCartSum - discountAmount).toFixed(2));

  let subtotal = baseAfterDiscount;
  let taxAmount = 0;
  let total = baseAfterDiscount;

  if (taxMode === 'included') {
    // Modo retail estándar: El precio en vitrina es el total final, el descuento se aplica primero
    total = baseAfterDiscount;
    if (effectiveTaxRate > 0) {
      subtotal = Number((total / (1 + effectiveTaxRate)).toFixed(2));
      taxAmount = Number((total - subtotal).toFixed(2));
    } else {
      subtotal = total;
      taxAmount = 0;
    }
  } else if (taxMode === 'added') {
    // Suma impuesto encima del precio ya descontado
    subtotal = baseAfterDiscount;
    taxAmount = Number((subtotal * effectiveTaxRate).toFixed(2));
    total = Number((subtotal + taxAmount).toFixed(2));
  } else {
    // Sin impuesto (taxMode === 'none')
    subtotal = baseAfterDiscount;
    taxAmount = 0;
    total = baseAfterDiscount;
  }

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (!activeBusiness || cart.length === 0) return;

    try {
      setProcessing(true);
      const invoiceNumber = `${settings?.invoice_prefix || 'FAC-'}${Date.now().toString().slice(-6)}`;

      // Buscar si el cliente corresponde a un cliente registrado en la base de datos
      const matchedCustomer = availableCustomers.find(
        (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
      );

      const finalAmountReceived = amountPaid ? parseFloat(amountPaid) : total;
      const changeAmount = amountPaid && parseFloat(amountPaid) >= total ? parseFloat(amountPaid) - total : 0;

      // 1. Create sale
      let saleData: any = null;
      const baseSalePayload = {
        business_id: activeBusiness.id,
        branch_id: activeMembership?.branch_id || mainBranch?.id || null,
        user_id: user?.id || null,
        customer_id: matchedCustomer?.id || null,
        invoice_number: invoiceNumber,
        subtotal,
        tax: taxAmount,
        total,
        payment_method: paymentMethod,
        status: 'completed',
      };

      // Intentar primero incluyendo amount_received y change_given
      const { data: sWithCash, error: sErrWithCash } = await supabase
        .from('sales')
        .insert({
          ...baseSalePayload,
          amount_received: finalAmountReceived,
          change_given: changeAmount,
        })
        .select()
        .single();

      if (!sErrWithCash && sWithCash) {
        saleData = sWithCash;
      } else if (sErrWithCash && (sErrWithCash.message?.includes('amount_received') || sErrWithCash.message?.includes('change_given'))) {
        // Fallback automático si la tabla sales aún no tiene esas columnas
        const { data: sBase, error: sErrBase } = await supabase
          .from('sales')
          .insert(baseSalePayload)
          .select()
          .single();

        if (sErrBase || !sBase) throw sErrBase || new Error('Error al registrar venta');
        saleData = sBase;
      } else {
        throw sErrWithCash || new Error('Error al registrar venta');
      }

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

      const cashierName = user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Administrador');

      setCompletedSale({
        ...saleData,
        items: cart,
        paid: amountPaid ? parseFloat(amountPaid) : total,
        change: changeAmount,
        customerName,
        customerNit,
        cashierName,
        discountAmount,
        discountType,
        discountValue,
        taxMode,
        taxAmount,
        subtotal,
        total,
      });

      // Reset
      setCart([]);
      setMobileCartOpen(false);
      setAmountPaid('');
      setDiscountValue('');
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
          barcode: newProdBarcode.trim() || null,
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
      setNewProdBarcode('');
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

  // ---- BARCODE SCANNER (pistola USB / Bluetooth + cámara) ----
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cameraTarget, setCameraTarget] = useState<'pos' | 'create' | null>(null);
  const isCameraOpen = cameraTarget !== null;

  const showScanResult = (data: ScanResultData) => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setScanResult(data);
    scanTimerRef.current = setTimeout(() => setScanResult(null), 3500);
  };

  // Cuando hay un modal de formulario abierto, desactivamos el scanner global
  // para no interferir con los campos de texto.
  const scannerActive =
    !isNewProductModalOpen &&
    !isScaleModalOpen &&
    !isClothingModalOpen &&
    !isCameraOpen;

  const handleBarcodeScan = (code: string) => {
    const clean = code.trim();
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.trim() === clean) ||
        (p.sku && p.sku.trim() === clean)
    );
    if (found) {
      addToCart(found);
      showScanResult({
        code: found.barcode || found.sku || clean,
        name: found.name,
        imageUrl: found.image_url,
        price: found.sale_price,
        stock: found.stock,
        currency,
        status: 'found',
        message: 'Agregado al carrito',
      });
    } else {
      showScanResult({
        code: clean,
        status: 'not_found',
        message: 'No encontrado en inventario',
      });
    }
  };

  const handlePosCameraScan = async (code: string, target: 'pos' | 'create') => {
    const clean = code.trim();
    if (target === 'pos') {
      handleBarcodeScan(clean);
      return;
    }

    // target === 'create'
    setNewProdBarcode(clean);
    showScanResult({
      code: clean,
      name: newProdName || undefined,
      imageUrl: newProdImage,
      status: 'new',
      message: 'Código capturado',
    });

    const online = await lookupBarcodeOnline(clean);
    if (online) {
      if (online.name) setNewProdName((prev) => prev || online.name || '');
      if (online.imageUrl) setNewProdImage((prev) => prev || online.imageUrl || null);
      showScanResult({
        code: clean,
        name: online.name || newProdName || undefined,
        imageUrl: online.imageUrl || newProdImage,
        status: 'online_match',
        message: 'Datos sugeridos automáticamente',
      });
    }
  };

  useBarcodeScanner(handleBarcodeScan, scannerActive);

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* ===== TARJETA RESULTADO ESCÁNER DE BARRAS ===== */}
      <ScanResultCard result={scanResult} onClose={() => setScanResult(null)} />

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
              {t('pos.title', 'Punto de Venta (POS)')}
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('pos.subtitle', 'Registro ágil de pedidos, cálculo de cobros y emisión de facturas')}
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
        <div className="flex-1 w-full space-y-3.5 min-w-0 pb-28 lg:pb-0">
          {/* BARRA DE ADAPTACIÓN INTELIGENTE SEGÚN GIRO DE NEGOCIO */}
          <BusinessModeBar
            currentType={businessType}
            selectedWeight={selectedWeight}
            onSelectWeight={setSelectedWeight}
            onOpenScaleModal={() => {
              setPendingScaleProduct(null);
              setIsScaleModalOpen(true);
            }}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            onPrintKitchenOrder={handlePrintKitchenOrder}
            hasItemsInCart={cart.length > 0}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            onQuickFilter={(term) => setSearch(term)}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            packDiscountActive={packDiscountActive}
            onTogglePackDiscount={() => setPackDiscountActive((p) => !p)}
          />

          {/* Barra de Búsqueda y Botón "+ Nuevo Producto" */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('pos.search_placeholder', 'Buscar por nombre, código de barra o SKU...')}
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

            {/* Botón cámara para móvil */}
            <button
              onClick={() => setCameraTarget('pos')}
              className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/25 transition-all cursor-pointer active:scale-95 flex-shrink-0"
              title="Escanear con cámara del celular"
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsNewProductModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('pos.new_product', 'Nuevo Producto')}</span>
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
                {t('pos.all_categories', 'Todos')} ({products.length})
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
              <p className="text-xs font-black text-slate-500">{t('pos.loading', 'Cargando productos...')}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#181615] rounded-3xl border-2 border-dashed border-slate-300 dark:border-zinc-800 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-black text-slate-800 dark:text-zinc-200">
                {t('pos.no_products', 'No se encontraron productos')}
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-1">
                {search ? t('pos.no_products', 'Intenta con otro término de búsqueda') : t('pos.no_products_hint', 'Agrega productos a tu catálogo para poder vender')}
              </p>
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-500 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {t('pos.create_now', 'Crear Producto Ahora')}
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
                    className={`bg-white dark:bg-[#181615] rounded-2xl border-2 transition-all duration-200 p-3.5 flex flex-col justify-between shadow-md hover:shadow-xl overflow-hidden ${
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
                          {t('pos.stock', 'Stock:')} {product.stock}
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

                    {/* Botones de Acción al pie de la tarjeta (Compactos y ajustados al contenedor) */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800 w-full min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setStockModalProduct(product);
                          setStockToAdd('10');
                        }}
                        className="px-2 py-1.5 text-[11px] font-black rounded-lg border-2 border-slate-300 dark:border-zinc-700 hover:border-slate-500 dark:hover:border-zinc-500 text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
                        title={t('pos.adjust_stock', '+Stock')}
                      >
                        {t('pos.adjust_stock', '+Stock')}
                      </button>

                      {inCartItem ? (
                        <button
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className="flex-1 min-w-0 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap overflow-hidden"
                          title="Añadir al carrito"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{t('pos.cart_in', 'Carrito +')}{inCartItem.quantity}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleProductSelect(product)}
                          className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 whitespace-nowrap overflow-hidden ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/20'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{t('pos.sell', 'Vender')}</span>
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

        {/* BACKDROP oscuro en móvil cuando el carrito está abierto */}
        {mobileCartOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileCartOpen(false)}
          />
        )}

        {/* FAB flotante del carrito — solo visible en móvil */}
        <button
          onClick={() => setMobileCartOpen(true)}
          className={`fixed bottom-6 right-5 z-50 lg:hidden w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 ${
            cart.length > 0
              ? 'bg-emerald-500 shadow-emerald-500/50'
              : 'bg-slate-700 shadow-slate-700/40'
          }`}
          style={{ display: mobileCartOpen ? 'none' : undefined }}
        >
          <ShoppingCart className="w-6 h-6 text-white" />
          {totalItemsCount > 0 && (
            <span className="text-white text-[11px] font-black leading-none">
              {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''}
            </span>
          )}
          {totalItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
              {totalItemsCount > 99 ? '99+' : totalItemsCount}
            </span>
          )}
        </button>

        {/* Panel carrito: bottom-drawer en móvil / columna lateral en desktop */}
        <div className={`
          lg:static lg:w-[380px] xl:w-[410px] lg:flex lg:flex-col lg:h-[calc(100vh-120px)] lg:max-h-[820px] lg:min-h-[480px] lg:sticky lg:top-3 lg:flex-shrink-0 lg:translate-y-0
          fixed bottom-0 left-0 right-0 z-50 flex flex-col
          bg-white dark:bg-[#181615] rounded-t-3xl lg:rounded-3xl border-2 border-slate-900/90 dark:border-zinc-700 shadow-2xl overflow-hidden
          transition-transform duration-300 ease-out
          ${mobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
          max-h-[88vh] lg:max-h-[820px]
        `}>
          {/* Handle de drag — solo visible en móvil */}
          <div className="lg:hidden flex justify-center pt-2.5 pb-1 bg-slate-900 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* 1. Cabecera Fija del Carrito */}
          <div className="bg-slate-900 text-white px-4 py-2.5 border-b-2 border-slate-950 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-white tracking-tight">
                {t('pos.cart_title', 'Carrito de Venta')}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                {totalItemsCount} {t('pos.items', 'items')}
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs font-black text-rose-400 hover:text-rose-300 hover:underline transition-colors cursor-pointer"
                >
                  {t('pos.cart_empty_btn', 'Vaciar')}
                </button>
              )}
            </div>
            {/* Botón cerrar — solo en móvil */}
            <button
              onClick={() => setMobileCartOpen(false)}
              className="lg:hidden ml-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* 2. Barra de Cliente Compacta (Fija arriba, accesible y no compite con la lista de productos) */}
          <div className="bg-slate-100/90 dark:bg-zinc-800/90 px-3.5 py-1.5 border-b border-slate-200 dark:border-zinc-700/80 flex items-center justify-between text-xs flex-shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 truncate">
                {t('pos.customer', 'Cliente')}: <strong className="text-slate-900 dark:text-zinc-100 font-black">{customerName}</strong>
                {customerNit ? ` (${customerNit})` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomerFields((prev) => !prev)}
              className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline ml-2 flex-shrink-0 cursor-pointer"
            >
              {showCustomerFields ? t('common.hide', 'Ocultar') : `${t('common.edit', 'Cambiar')}`}
            </button>
          </div>

          {/* Desplegable de Cliente (si se activa) */}
          {showCustomerFields && (
            <div className="p-3 bg-slate-50 dark:bg-zinc-850 border-b border-slate-200 dark:border-zinc-700/80 animate-fadeIn space-y-2 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-0.5">
                    {t('pos.customer_name', 'Nombre / Razón')}
                  </label>
                  <input
                    type="text"
                    list="pos-customers-list"
                    value={customerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerName(val);
                      const found = availableCustomers.find(
                        (c) => c.name.toLowerCase() === val.toLowerCase()
                      );
                      if (found && found.identification) {
                        setCustomerNit(found.identification);
                      }
                    }}
                    placeholder={t('pos.consumer', 'Consumidor Final')}
                    className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="pos-customers-list">
                    {availableCustomers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.identification ? `NIT: ${c.identification}` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-0.5">
                    {t('pos.tax_id', 'NIT / CI')}
                  </label>
                  <input
                    type="text"
                    value={customerNit}
                    onChange={(e) => setCustomerNit(e.target.value)}
                    placeholder="ej. 8493021"
                    className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {availableCustomers.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
                  <span className="text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap">{t('pos.quick_discounts', 'Rápidos:')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName('Consumidor Final');
                      setCustomerNit('');
                      setShowCustomerFields(false);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-black hover:bg-slate-300 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t('pos.consumer', 'Consumidor Final')}
                  </button>
                  {availableCustomers.slice(0, 3).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomerName(c.name);
                        if (c.identification) setCustomerNit(c.identification);
                        setShowCustomerFields(false);
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Cuerpo de Productos Seleccionados (Prioridad de Espacio y Gran Claridad) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/60 dark:bg-zinc-900/40">
            {cart.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500 py-8 px-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-200/60 dark:bg-zinc-800 flex items-center justify-center mb-2.5">
                  <ShoppingCart className="w-7 h-7 text-slate-400 dark:text-zinc-500" />
                </div>
                <p className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  {t('pos.cart_empty', 'El carrito está vacío')}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 max-w-[200px]">
                  {t('pos.cart_empty_hint', 'Toca los productos para agregarlos a la venta')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-2xl bg-white dark:bg-zinc-850 border border-slate-200/90 dark:border-zinc-700/80 shadow-xs hover:border-slate-300 dark:hover:border-zinc-600 transition-all flex items-center gap-3"
                  >
                    {/* Miniatura del Producto */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Título, Precios y Controles de Cantidad */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 pr-1">
                          <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 leading-tight truncate" title={item.product.name}>
                            {item.product.name}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 mt-0.5">
                            {formatCurrency(item.product.sale_price, currency)} {item.weightKg ? '/ kg' : 'c/u'}
                          </p>

                          {/* Badges de Rubro Específico */}
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {item.weightKg && (
                              <span className="text-[9px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.2 rounded-md">
                                ⚖️ {item.weightKg} kg
                              </span>
                            )}
                            {item.variant && (
                              <span className="text-[9px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 px-1.5 py-0.2 rounded-md">
                                👗 {item.variant.size ? `Talla: ${item.variant.size}` : ''} {item.variant.color ? `· ${item.variant.color}` : ''}
                              </span>
                            )}
                            {item.tableNumber && businessType === 'restaurant' && (
                              <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 px-1.5 py-0.2 rounded-md">
                                🍽️ {item.tableNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
                          {formatCurrency(
                            item.weightKg
                              ? item.product.sale_price * item.weightKg
                              : item.product.sale_price * item.quantity,
                            currency
                          )}
                        </span>
                      </div>

                      {/* Barra de Stepper y Botón Eliminar */}
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-700">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-5 h-5 rounded-md bg-white dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-800 dark:text-zinc-200 flex items-center justify-center font-black text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Restar 1"
                          >
                            <Minus className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                          <span className="w-5 text-center text-xs font-black text-slate-900 dark:text-zinc-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-5 h-5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-black text-xs transition-colors cursor-pointer shadow-2xs"
                            title="Sumar 1"
                          >
                            <Plus className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Quitar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Footer Fijo de Cobro: Ultra Compacto, Inteligente y SIEMPRE 100% VISIBLE */}
          <div className="p-3 border-t-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 space-y-2 shadow-lg">
            {/* Fila Subtotal */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400">
              <span>{t('pos.subtotal', 'Subtotal')} ({totalItemsCount} {t('common.units', 'unid.')}):</span>
              <span className="font-mono text-slate-900 dark:text-zinc-100 font-black">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>

            {/* Fila de Impuesto Activo (si fue habilitado) */}
            {taxMode !== 'none' && (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 text-xs animate-fadeIn">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 truncate">
                    {t('pos.tax', 'IVA')} ({taxPercentage}% {taxMode === 'included' ? 'inc.' : 'adic.'})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTaxDrawer((prev) => !prev)}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 underline cursor-pointer hover:text-emerald-900"
                  >
                    {showTaxDrawer ? t('common.close', 'Cerrar') : t('common.edit', 'Ajustar')}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                    {taxMode === 'added'
                      ? `+${formatCurrency(taxAmount, currency)}`
                      : `(${formatCurrency(taxAmount, currency)})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTaxMode('none');
                      setShowTaxDrawer(false);
                    }}
                    className="p-1 rounded-md text-emerald-600 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Desactivar IVA"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Fila de Descuento Activo (si fue aplicado) */}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/80 text-xs animate-fadeIn">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-black text-rose-800 dark:text-rose-300 truncate">
                    {t('pos.discount', 'Descuento')} ({discountType === 'percent' ? `${discountValue}%` : 'Fijo'})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDiscountDrawer((prev) => !prev)}
                    className="text-[10px] font-bold text-rose-700 dark:text-rose-400 underline cursor-pointer hover:text-rose-900"
                  >
                    {showDiscountDrawer ? t('common.close', 'Cerrar') : t('common.edit', 'Ajustar')}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-black text-rose-700 dark:text-rose-300">
                    -{formatCurrency(discountAmount, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountValue('');
                      setShowDiscountDrawer(false);
                    }}
                    className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Quitar descuento"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Botones Opcionales: Aparecen si NO están activos para permitir habilitarlos */}
            {(taxMode === 'none' || discountAmount === 0) && (
              <div className="flex items-center gap-1.5">
                {taxMode === 'none' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTaxMode('included');
                      setShowTaxDrawer(true);
                      setShowDiscountDrawer(false);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-[11px] font-black text-slate-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t('pos.add_tax', '+ IVA')}</span>
                  </button>
                )}

                {discountAmount === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscountDrawer(true);
                      setShowTaxDrawer(false);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 text-[11px] font-black text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t('pos.add_discount', '+ Descuento')}</span>
                  </button>
                )}
              </div>
            )}

            {/* Subpanel Desplegable de IVA (Configuración de Tasa y Modo) */}
            {showTaxDrawer && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/90 border border-emerald-300 dark:border-emerald-700 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                    {t('pos.tax', 'Configurar IVA')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTaxMode('none');
                        setShowTaxDrawer(false);
                      }}
                      className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      {t('pos.disable_tax', 'Desactivar')} ✕
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTaxDrawer(false)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {t('common.close', 'Cerrar')}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-zinc-700 text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setTaxMode('included')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        taxMode === 'included'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-300'
                      }`}
                      title="IVA ya incluido en el precio de venta"
                    >
                      IVA Incluido
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('added')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        taxMode === 'added'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-300'
                      }`}
                      title="Sumar IVA adicional encima del precio"
                    >
                      + Sumar Adicional
                    </button>
                  </div>

                  <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-300">
                    {taxMode === 'added' ? `+${formatCurrency(taxAmount, currency)}` : `(${formatCurrency(taxAmount, currency)} inc.)`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">Tasa:</span>
                    <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 rounded-md px-1.5 py-0.5 shadow-2xs">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={taxPercentage}
                        onChange={(e) => handleTaxPercentageChange(parseFloat(e.target.value) || 0)}
                        className="w-8 text-center text-xs font-black text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <span className="text-xs font-black text-emerald-600">%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[13, 16, 18, 19].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleTaxPercentageChange(p)}
                        className={`px-1.5 py-0.5 text-[10px] font-black rounded border cursor-pointer transition-all ${
                          taxPercentage === p
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-emerald-500'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subpanel Desplegable de Descuento (Porcentaje o Monto Fijo) */}
            {showDiscountDrawer && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/90 border border-rose-300 dark:border-rose-700 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-300">
                    {t('pos.discount', 'Aplicar Descuento')}
                  </span>
                  <div className="flex items-center gap-2">
                    {discountAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountValue('');
                          setShowDiscountDrawer(false);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        {t('pos.remove_discount', 'Quitar')} ✕
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDiscountDrawer(false)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {t('common.close', 'Cerrar')}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-zinc-700 text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => { setDiscountType('percent'); setDiscountValue(''); }}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        discountType === 'percent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      % Porcentaje
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountType('fixed'); setDiscountValue(''); }}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        discountType === 'fixed'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {t('pos.fixed_amount', 'Monto fijo')}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 rounded-lg px-2 py-0.5 shadow-xs">
                      {discountType === 'fixed' && (
                        <span className="text-[10px] font-black text-slate-400 mr-0.5">{currency === 'BOB' ? 'Bs' : currency === 'USD' ? '$' : currency}</span>
                      )}
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percent' ? '100' : rawCartSum.toFixed(2)}
                        step="any"
                        placeholder={discountType === 'percent' ? '0' : '0.00'}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-14 text-right text-xs font-black text-slate-900 dark:text-zinc-100 focus:outline-none bg-transparent font-mono"
                        autoFocus
                      />
                      {discountType === 'percent' && (
                        <span className="text-[10px] font-black text-rose-600">%</span>
                      )}
                    </div>
                  </div>
                </div>

                {discountType === 'percent' && (
                  <div className="flex items-center gap-1 pt-1 border-t border-slate-200 dark:border-zinc-700">
                    <span className="text-[9px] font-black text-slate-400 mr-1">Rápido:</span>
                    {[5, 10, 15, 20, 25, 50].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDiscountValue(String(p))}
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded border cursor-pointer transition-all ${
                          discountValue === String(p)
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-rose-400'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fila Total a Cobrar */}
            <div className="pt-1 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  {t('pos.total', 'TOTAL A COBRAR:')}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>

            {/* Selector de Método de Pago Compacto */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: t('pos.cash', 'Efectivo'), icon: Banknote },
                { id: 'transfer', label: t('pos.transfer', 'QR / Trans.'), icon: Smartphone },
                { id: 'card', label: t('pos.card', 'Tarjeta'), icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-1.5 px-1.5 rounded-xl border-2 flex items-center justify-center gap-1 transition-all cursor-pointer font-black text-xs ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[10px] sm:text-[11px] truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Calculadora de Efectivo y Vuelto */}
            {paymentMethod === 'cash' && cart.length > 0 && (
              <div className="bg-slate-50 dark:bg-zinc-800/80 p-2 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="any"
                      placeholder={total.toFixed(2)}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-black px-2 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-600 focus:outline-none focus:border-emerald-500 text-right pr-2"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setAmountPaid(total.toFixed(2))}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-800 dark:text-zinc-200 text-[10px] font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Exacto
                  </button>

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
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-[11px] font-black">
                    <span>{t('pos.change', 'Cambio / Vuelto:')}</span>
                    <span className="text-xs font-black font-mono">
                      {formatCurrency(parseFloat(amountPaid) - total, currency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Botón Principal: Cobrar Venta (SIEMPRE 100% VISIBLE) */}
            <button
              type="button"
              disabled={cart.length === 0 || processing}
              onClick={handleCheckout}
              className={`w-full py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                cart.length === 0 || processing
                  ? 'bg-slate-300 dark:bg-zinc-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-98'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {processing
                  ? t('common.loading', 'Procesando Venta...')
                  : cart.length === 0
                  ? t('pos.cart_empty', 'Carrito Vacío')
                  : `${t('pos.process_sale', 'Cobrar')} ${formatCurrency(total, currency)}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ESCANEO CON CÁMARA (MÓVIL)                       */}
      {/* ======================================================== */}
      <BarcodeCameraModal
        isOpen={isCameraOpen}
        onClose={() => setCameraTarget(null)}
        onScan={(code) => {
          const target = cameraTarget || 'pos';
          setCameraTarget(null);
          handlePosCameraScan(code, target);
        }}
        title={cameraTarget === 'create' ? 'Escanear → Nuevo Producto' : 'Escanear → Carrito'}
      />

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

              {/* COLUMNA DERECHA: CÓDIGO DE BARRAS, SKU, NOMBRE, DESCRIPCIÓN Y STOCK */}
              <div className="space-y-3.5">
                {/* 1. Código de Barras y SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-zinc-200 mb-1.5">
                      Código de Barras <span className="font-normal text-[10px] text-slate-400">(Escaneado)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newProdBarcode}
                        onChange={(e) => setNewProdBarcode(e.target.value)}
                        placeholder="Ej: 7771214001109"
                        className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
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
                      value={newProdSku}
                      onChange={(e) => setNewProdSku(e.target.value)}
                      placeholder="PROD-3400"
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
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
      {/* MODAL: FACTURA PROFESIONAL POST-VENTA                    */}
      {/* ======================================================== */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">

            {/* ── CABECERA DEL NEGOCIO (color oscuro) ── */}
            <div
              className="relative rounded-t-3xl px-6 pt-5 pb-4"
              style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #0f4c2a 60%, #166534 100%)' }}
            >
              {/* Badge FACTURA OFICIAL */}
              <div className="flex items-start justify-between mb-3">
                <span className="bg-emerald-400/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Factura Oficial · {activeBusiness?.name?.toUpperCase() || 'MI NEGOCIO'}
                </span>
                <span className="bg-white/10 border border-white/20 text-white text-[11px] font-black px-3 py-1 rounded-full font-mono">
                  {completedSale.invoice_number}
                </span>
              </div>

              {/* Logo + Nombre del Negocio */}
              <div className="flex items-center gap-4">
                {activeBusiness?.logo_url ? (
                  <img
                    src={activeBusiness.logo_url}
                    alt={activeBusiness.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600/40 border-2 border-emerald-400/50 flex items-center justify-center flex-shrink-0">
                    <Store className="w-7 h-7 text-emerald-300" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">
                    {activeBusiness?.name || 'Mi Negocio'}
                  </h2>
                  {activeBusiness?.address && (
                    <p className="text-emerald-300/80 text-[11px] font-bold mt-0.5">
                      {activeBusiness.address}
                      {activeBusiness.city ? ` · ${activeBusiness.city}` : ''}
                    </p>
                  )}
                  {activeBusiness?.phone && (
                    <p className="text-emerald-300/70 text-[11px] font-bold">
                      Tel: {activeBusiness.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Fecha/Hora */}
              <p className="text-emerald-300/70 text-[10px] font-bold mt-2 text-right">
                {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {' · '}
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* ── CUERPO DE LA FACTURA ── */}
            <div className="px-5 py-4 space-y-4">

              {/* Grid: Datos del Cliente + Datos de Emisión */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Datos del Cliente</p>
                  <p className="text-sm font-black text-slate-900 dark:text-zinc-100">
                    {completedSale.customerName || 'Consumidor Final'}
                  </p>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                    NIT / CI: {completedSale.customerNit || 'S/N'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Datos de Emisión</p>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                    Cajero: <span className="font-black">{completedSale.cashierName || 'Administrador'}</span>
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                    Método:{' '}
                    <span className="font-black capitalize">
                      {completedSale.payment_method === 'cash' ? 'Efectivo' : completedSale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Tabla de Productos con Foto */}
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
                {/* Encabezado */}
                <div className="grid grid-cols-12 bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  <span className="col-span-2 text-center">Cant.</span>
                  <span className="col-span-6">Producto</span>
                  <span className="col-span-2 text-right">P. Unit</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                </div>
                {/* Filas */}
                {(completedSale.items || []).map((item: CartItem, i: number) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 px-3 py-2 text-xs border-t border-slate-100 dark:border-zinc-800 items-center"
                  >
                    <span className="col-span-2 font-black text-slate-700 dark:text-zinc-300 text-center">
                      x{item.quantity}
                    </span>
                    <div className="col-span-6 flex items-center gap-2 min-w-0 pr-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-zinc-100 truncate text-xs">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {item.product.sku || item.product.barcode || ''}
                        </p>
                      </div>
                    </div>
                    <span className="col-span-2 text-right font-mono text-slate-600 dark:text-zinc-400 text-[11px]">
                      {formatCurrency(item.product.sale_price, currency)}
                    </span>
                    <span className="col-span-2 text-right font-black text-slate-900 dark:text-zinc-100 font-mono">
                      {formatCurrency(item.product.sale_price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales + QR */}
              <div className="flex items-end gap-4">
                {/* QR placeholder */}
                <div className="flex-shrink-0 w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-400 dark:text-zinc-500" />
                  <p className="text-[8px] font-black text-slate-400 mt-1 text-center leading-tight">
                    Comprobante<br/>Válido
                  </p>
                </div>

                {/* Desglose */}
                <div className="flex-1 space-y-1 text-xs">
                  {/* Subtotal */}
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400 font-bold">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(completedSale.subtotal ?? completedSale.total, currency)}</span>
                  </div>

                  {/* Descuento (si existe) */}
                  {completedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                      <span>
                        Descuento
                        {completedSale.discountType === 'percent'
                          ? ` (${completedSale.discountValue}%)`
                          : ' (Monto fijo)'}:
                      </span>
                      <span className="font-mono font-black">-{formatCurrency(completedSale.discountAmount, currency)}</span>
                    </div>
                  )}

                  {/* IVA */}
                  {completedSale.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-zinc-500 font-bold">
                      <span>IVA ({completedSale.taxMode === 'included' ? 'Inc.' : '+' + taxPercentage + '%'}):</span>
                      <span className="font-mono">
                        {completedSale.taxMode === 'included'
                          ? `(${formatCurrency(completedSale.taxAmount, currency)} inc.)`
                          : `+${formatCurrency(completedSale.taxAmount, currency)}`}
                      </span>
                    </div>
                  )}

                  {/* Monto recibido (efectivo) */}
                  {completedSale.payment_method === 'cash' && completedSale.paid > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400 font-bold pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span>Monto Recibido:</span>
                      <span className="font-mono">{formatCurrency(completedSale.paid, currency)}</span>
                    </div>
                  )}

                  {/* Vuelto */}
                  {completedSale.payment_method === 'cash' && completedSale.change > 0 && (
                    <div className="flex justify-between font-black text-emerald-600 dark:text-emerald-400">
                      <span>Vuelto / Cambio:</span>
                      <span className="font-mono">{formatCurrency(completedSale.change, currency)}</span>
                    </div>
                  )}

                  {/* TOTAL */}
                  <div className="flex justify-between font-black text-slate-900 dark:text-zinc-100 pt-1.5 border-t-2 border-slate-300 dark:border-zinc-600 mt-1">
                    <span className="text-sm uppercase tracking-wider">Total a Pagar:</span>
                    <span className="text-sm font-mono text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(completedSale.total, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer nota */}
              <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500 font-bold italic px-4 border-t border-slate-100 dark:border-zinc-800 pt-3">
                {settings?.receipt_footer || '"Gracias por su preferencia — Esta nota de venta avala la entrega de mercadería"'}
              </p>
            </div>

            {/* ── BOTONES DE ACCIÓN ── */}
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Cerrar */}
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="py-2.5 rounded-xl border-2 border-slate-200 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              {/* Ticket Mini 58mm */}
              <button
                type="button"
                onClick={() => {
                  const win = window.open('', '_blank', 'width=340,height=700');
                  if (!win) return;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    (typeof window !== 'undefined' ? window.location.origin : '') + '/factura/' + completedSale.invoice_number
                  )}`;
                  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                  win.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                      <meta charset="utf-8" />
                      <title>Ticket 58mm - ${completedSale.invoice_number}</title>
                      <style>
                        @page {
                          size: 58mm auto;
                          margin: 0;
                        }
                        * {
                          margin: 0;
                          padding: 0;
                          box-sizing: border-box;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        body {
                          font-family: 'Courier New', Courier, monospace;
                          font-size: 10px;
                          line-height: 1.25;
                          color: #000000;
                          background: #ffffff;
                          width: 48mm;
                          max-width: 48mm;
                          margin: 0 auto;
                          padding: 4mm 2mm 8mm 2mm;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .bold { font-weight: bold; }
                        .biz-name {
                          font-size: 13px;
                          font-weight: 900;
                          text-transform: uppercase;
                          margin-bottom: 2px;
                        }
                        .biz-sub {
                          font-size: 8.5px;
                          color: #222222;
                          margin-bottom: 1px;
                        }
                        .divider-double {
                          border-top: 1px dashed #000;
                          border-bottom: 1px dashed #000;
                          height: 3px;
                          margin: 4px 0;
                        }
                        .divider-single {
                          border-top: 1px dashed #000;
                          margin: 3px 0;
                        }
                        .meta-row {
                          display: flex;
                          justify-content: space-between;
                          font-size: 8.5px;
                          margin-bottom: 1px;
                        }
                        .items-header {
                          display: flex;
                          justify-content: space-between;
                          font-weight: bold;
                          font-size: 8.5px;
                          padding: 1px 0;
                        }
                        .item-block {
                          margin-bottom: 3px;
                        }
                        .item-title {
                          font-weight: bold;
                          font-size: 9.5px;
                          word-break: break-word;
                        }
                        .item-calc {
                          display: flex;
                          justify-content: space-between;
                          font-size: 8.5px;
                          padding-left: 2px;
                          color: #222222;
                        }
                        .tot-row {
                          display: flex;
                          justify-content: space-between;
                          font-size: 9px;
                          margin-bottom: 1px;
                        }
                        .total-banner {
                          font-size: 12px;
                          font-weight: 900;
                          display: flex;
                          justify-content: space-between;
                          padding: 3px 0;
                        }
                        .qr-box {
                          margin: 6px auto 2px auto;
                          text-align: center;
                        }
                        .qr-img {
                          width: 58px;
                          height: 58px;
                          display: inline-block;
                        }
                        .footer-note {
                          text-align: center;
                          font-size: 8px;
                          margin-top: 4px;
                          line-height: 1.2;
                        }
                        .cut-space {
                          height: 16px;
                        }
                      </style>
                    </head>
                    <body>
                      ${activeBusiness?.logo_url ? `
                        <div style="text-align: center; margin-bottom: 5px;">
                          <img src="${activeBusiness.logo_url}" alt="Logo" style="max-height: 38px; max-width: 80%; object-fit: contain; filter: grayscale(100%);" />
                        </div>
                      ` : ''}
                      <div class="text-center bold biz-name">${activeBusiness?.name || 'MI NEGOCIO'}</div>
                      ${activeBusiness?.address ? `<div class="text-center biz-sub">${activeBusiness.address}</div>` : ''}
                      ${activeBusiness?.phone ? `<div class="text-center biz-sub">Tel: ${activeBusiness.phone}</div>` : ''}

                      <div class="divider-double"></div>

                      <div class="meta-row"><span>TICKET:</span><span class="bold">${completedSale.invoice_number}</span></div>
                      <div class="meta-row"><span>FECHA:</span><span>${dateStr} ${timeStr}</span></div>
                      <div class="meta-row"><span>CLIENTE:</span><span>${completedSale.customerName || 'Consumidor Final'}</span></div>
                      <div class="meta-row"><span>NIT/CI:</span><span>${completedSale.customerNit || 'S/N'}</span></div>
                      <div class="meta-row"><span>PAGO:</span><span class="bold">${(completedSale.payment_method === 'cash' ? 'Efectivo' : completedSale.payment_method === 'transfer' ? 'QR/Trans.' : 'Tarjeta').toUpperCase()}</span></div>

                      <div class="divider-single"></div>
                      <div class="items-header"><span>CANT. ARTÍCULO</span><span>TOTAL</span></div>
                      <div class="divider-single"></div>

                      ${(completedSale.items || []).map((item: CartItem) => `
                        <div class="item-block">
                          <div class="item-title">
                            ${item.weightKg ? `${item.weightKg} kg` : `x${item.quantity}`} ${item.product.name}
                            ${item.variant ? `<br/><small style="color:#666;">👗 ${item.variant.size ? 'Talla ' + item.variant.size : ''} ${item.variant.color || ''}</small>` : ''}
                            ${item.tableNumber ? `<br/><small style="color:#666;">🍽️ ${item.tableNumber}</small>` : ''}
                          </div>
                          <div class="item-calc">
                            <span>${formatCurrency(item.product.sale_price, currency)} ${item.weightKg ? '/kg' : ''}</span>
                            <span class="bold">${formatCurrency(item.weightKg ? item.product.sale_price * item.weightKg : item.product.sale_price * item.quantity, currency)}</span>
                          </div>
                        </div>
                      `).join('')}

                      <div class="divider-single"></div>

                      <div class="tot-row">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(completedSale.subtotal ?? completedSale.total, currency)}</span>
                      </div>

                      ${completedSale.discountAmount > 0 ? `
                        <div class="tot-row">
                          <span>Desc. ${completedSale.discountType === 'percent' ? completedSale.discountValue + '%' : ''}:</span>
                          <span>-${formatCurrency(completedSale.discountAmount, currency)}</span>
                        </div>
                      ` : ''}

                      ${completedSale.taxAmount > 0 ? `
                        <div class="tot-row">
                          <span>IVA:</span>
                          <span>${formatCurrency(completedSale.taxAmount, currency)}</span>
                        </div>
                      ` : ''}

                      <div class="divider-double"></div>
                      <div class="total-banner">
                        <span>TOTAL:</span>
                        <span>${formatCurrency(completedSale.total, currency)}</span>
                      </div>
                      <div class="divider-double"></div>

                      ${completedSale.payment_method === 'cash' && completedSale.paid > 0 ? `
                        <div class="tot-row"><span>Entregado:</span><span>${formatCurrency(completedSale.paid, currency)}</span></div>
                        <div class="tot-row bold"><span>Cambio:</span><span>${formatCurrency(completedSale.change, currency)}</span></div>
                        <div class="divider-single"></div>
                      ` : ''}

                      <div class="qr-box">
                        <img src="${qrUrl}" alt="QR" class="qr-img" />
                        <div style="font-size: 7.5px; margin-top: 1px;">COMPROBANTE VÁLIDO</div>
                      </div>

                      <div class="footer-note">
                        ${settings?.receipt_footer || '¡Gracias por su compra!'}
                      </div>

                      <div class="cut-space"></div>

                      <script>
                        window.addEventListener('load', function() {
                          var imgs = Array.from(document.images);
                          Promise.all(imgs.map(function(img) {
                            if (img.complete) return Promise.resolve();
                            return new Promise(function(resolve) {
                              img.onload = resolve;
                              img.onerror = resolve;
                            });
                          })).then(function() {
                            setTimeout(function() {
                              window.print();
                            }, 200);
                          });
                        });
                      </script>
                    </body>
                    </html>
                  `);
                  win.document.close();
                }}
                className="py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-emerald-400 border border-slate-700 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-800 transition-colors"
                title="Para mini impresoras térmicas portátiles de bolsillo (58mm)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Ticket Mini (58mm)</span>
              </button>

              {/* Ticket Térmico POS 80mm */}
              <button
                type="button"
                onClick={() => {
                  const win = window.open('', '_blank', 'width=420,height=750');
                  if (!win) return;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    (typeof window !== 'undefined' ? window.location.origin : '') + '/factura/' + completedSale.invoice_number
                  )}`;
                  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                  win.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                      <meta charset="utf-8" />
                      <title>Ticket POS 80mm - ${completedSale.invoice_number}</title>
                      <style>
                        @page {
                          size: 80mm auto;
                          margin: 0;
                        }
                        * {
                          margin: 0;
                          padding: 0;
                          box-sizing: border-box;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        body {
                          font-family: 'Courier New', Courier, monospace;
                          font-size: 11px;
                          line-height: 1.35;
                          color: #000000;
                          background: #ffffff;
                          width: 76mm;
                          max-width: 76mm;
                          margin: 0 auto;
                          padding: 6mm 4mm 14mm 4mm;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .bold { font-weight: bold; }
                        .biz-name {
                          font-size: 15px;
                          font-weight: 900;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                          margin-bottom: 2px;
                        }
                        .biz-sub {
                          font-size: 10px;
                          color: #333333;
                          margin-bottom: 1px;
                        }
                        .divider-double {
                          border-top: 1px dashed #000;
                          border-bottom: 1px dashed #000;
                          height: 3px;
                          margin: 6px 0;
                        }
                        .divider-single {
                          border-top: 1px dashed #000;
                          margin: 5px 0;
                        }
                        .meta-row {
                          display: flex;
                          justify-content: space-between;
                          font-size: 10px;
                          margin-bottom: 2px;
                        }
                        .items-header {
                          display: flex;
                          justify-content: space-between;
                          font-weight: bold;
                          font-size: 10px;
                          padding: 2px 0;
                        }
                        .item-block {
                          margin-bottom: 5px;
                        }
                        .item-title {
                          font-weight: bold;
                          font-size: 11px;
                          word-break: break-word;
                        }
                        .item-calc {
                          display: flex;
                          justify-content: space-between;
                          font-size: 10px;
                          padding-left: 6px;
                          color: #222222;
                        }
                        .tot-row {
                          display: flex;
                          justify-content: space-between;
                          font-size: 11px;
                          margin-bottom: 2px;
                        }
                        .total-banner {
                          font-size: 14px;
                          font-weight: 900;
                          display: flex;
                          justify-content: space-between;
                          padding: 4px 0;
                        }
                        .qr-box {
                          margin: 8px auto 4px auto;
                          text-align: center;
                        }
                        .qr-img {
                          width: 72px;
                          height: 72px;
                          display: inline-block;
                        }
                        .footer-note {
                          text-align: center;
                          font-size: 9px;
                          margin-top: 6px;
                          line-line: 1.3;
                        }
                        .cut-space {
                          height: 20px;
                        }
                      </style>
                    </head>
                    <body>
                      <!-- Encabezado del Negocio -->
                      ${activeBusiness?.logo_url ? `
                        <div style="text-align: center; margin-bottom: 6px;">
                          <img src="${activeBusiness.logo_url}" alt="Logo" style="max-height: 48px; max-width: 80%; object-fit: contain; filter: grayscale(100%);" />
                        </div>
                      ` : ''}
                      <div class="text-center bold biz-name">${activeBusiness?.name || 'MI NEGOCIO'}</div>
                      ${activeBusiness?.address ? `<div class="text-center biz-sub">${activeBusiness.address}${activeBusiness.city ? ' - ' + activeBusiness.city : ''}</div>` : ''}
                      ${activeBusiness?.phone ? `<div class="text-center biz-sub">Tel: ${activeBusiness.phone}</div>` : ''}

                      <div class="divider-double"></div>

                      <!-- Datos del Ticket -->
                      <div class="meta-row"><span>TICKET Nº:</span><span class="bold">${completedSale.invoice_number}</span></div>
                      <div class="meta-row"><span>FECHA:</span><span>${dateStr} ${timeStr}</span></div>
                      <div class="meta-row"><span>CLIENTE:</span><span>${completedSale.customerName || 'Consumidor Final'}</span></div>
                      <div class="meta-row"><span>NIT/CI:</span><span>${completedSale.customerNit || 'S/N'}</span></div>
                      <div class="meta-row"><span>CAJERO:</span><span>${completedSale.cashierName || 'Administrador'}</span></div>
                      <div class="meta-row"><span>PAGO:</span><span class="bold">${(completedSale.payment_method === 'cash' ? 'Efectivo' : completedSale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta').toUpperCase()}</span></div>

                      <div class="divider-single"></div>
                      <div class="items-header"><span>CANT. ARTÍCULO</span><span>TOTAL</span></div>
                      <div class="divider-single"></div>

                      <!-- Lista de Artículos -->
                      ${(completedSale.items || []).map((item: CartItem) => `
                        <div class="item-block">
                          <div class="item-title">
                            ${item.weightKg ? `${item.weightKg} kg` : `x${item.quantity}`} ${item.product.name}
                            ${item.variant ? `<br/><small style="color:#555;">👗 ${item.variant.size ? 'Talla ' + item.variant.size : ''} ${item.variant.color || ''}</small>` : ''}
                            ${item.tableNumber ? `<br/><small style="color:#555;">🍽️ ${item.tableNumber}</small>` : ''}
                          </div>
                          <div class="item-calc">
                            <span>${formatCurrency(item.product.sale_price, currency)} ${item.weightKg ? '/kg' : 'c/u'}</span>
                            <span class="bold">${formatCurrency(item.weightKg ? item.product.sale_price * item.weightKg : item.product.sale_price * item.quantity, currency)}</span>
                          </div>
                        </div>
                      `).join('')}

                      <div class="divider-single"></div>

                      <!-- Totales -->
                      <div class="tot-row">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(completedSale.subtotal ?? completedSale.total, currency)}</span>
                      </div>

                      ${completedSale.discountAmount > 0 ? `
                        <div class="tot-row">
                          <span>Descuento ${completedSale.discountType === 'percent' ? '(' + completedSale.discountValue + '%)' : ''}:</span>
                          <span>-${formatCurrency(completedSale.discountAmount, currency)}</span>
                        </div>
                      ` : ''}

                      ${completedSale.taxAmount > 0 ? `
                        <div class="tot-row">
                          <span>IVA (${completedSale.taxMode === 'included' ? 'Inc.' : '+' + taxPercentage + '%'}):</span>
                          <span>${formatCurrency(completedSale.taxAmount, currency)}</span>
                        </div>
                      ` : ''}

                      <div class="divider-double"></div>
                      <div class="total-banner">
                        <span>TOTAL A PAGAR:</span>
                        <span>${formatCurrency(completedSale.total, currency)}</span>
                      </div>
                      <div class="divider-double"></div>

                      ${completedSale.payment_method === 'cash' && completedSale.paid > 0 ? `
                        <div class="tot-row"><span>Efectivo Recibido:</span><span>${formatCurrency(completedSale.paid, currency)}</span></div>
                        <div class="tot-row bold"><span>Cambio / Vuelto:</span><span>${formatCurrency(completedSale.change, currency)}</span></div>
                        <div class="divider-single"></div>
                      ` : ''}

                      <!-- QR de Verificación Rápida -->
                      <div class="qr-box">
                        <img src="${qrUrl}" alt="QR" class="qr-img" />
                        <div style="font-size: 8px; margin-top: 2px;">COMPROBANTE VÁLIDO</div>
                      </div>

                      <div class="footer-note">
                        ${settings?.receipt_footer || '¡Gracias por su preferencia! Conserve este comprobante.'}
                      </div>

                      <div class="cut-space"></div>

                      <script>
                        window.addEventListener('load', function() {
                          var imgs = Array.from(document.images);
                          Promise.all(imgs.map(function(img) {
                            if (img.complete) return Promise.resolve();
                            return new Promise(function(resolve) {
                              img.onload = resolve;
                              img.onerror = resolve;
                            });
                          })).then(function() {
                            setTimeout(function() {
                              window.print();
                            }, 200);
                          });
                        });
                      </script>
                    </body>
                    </html>
                  `);
                  win.document.close();
                }}
                className="py-2.5 rounded-xl bg-slate-800 dark:bg-zinc-700 text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-700 transition-colors"
                title="Para impresoras térmicas de mostrador estándar (80mm)"
              >
                <Receipt className="w-3.5 h-3.5 text-blue-400" />
                <span>Ticket POS (80mm)</span>
              </button>

              {/* Imprimir Factura Formal */}
              <button
                type="button"
                onClick={() => {
                  const win = window.open('', '_blank', 'width=950,height=800');
                  if (!win) return;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    (typeof window !== 'undefined' ? window.location.origin : '') + '/factura/' + completedSale.invoice_number
                  )}`;
                  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                  win.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                      <meta charset="utf-8" />
                      <title>Factura ${completedSale.invoice_number} - ${activeBusiness?.name || 'Komerz POS'}</title>
                      <style>
                        @page {
                          size: letter portrait;
                          margin: 12mm 14mm;
                        }
                        * {
                          margin: 0;
                          padding: 0;
                          box-sizing: border-box;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                          color-adjust: exact !important;
                        }
                        body {
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                          color: #0f172a;
                          background: #ffffff;
                          font-size: 11px;
                          line-height: 1.4;
                        }
                        .invoice-container {
                          max-width: 780px;
                          margin: 0 auto;
                          border: 1px solid #cbd5e1;
                          border-radius: 18px;
                          overflow: hidden;
                        }
                        /* Cabecera idéntica al catálogo de stock (Image 2) con degradado rico */
                        .header-banner {
                          background: linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%) !important;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                          color: #ffffff;
                          padding: 18px 24px;
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 16px;
                        }
                        .logo-box {
                          width: 58px;
                          height: 58px;
                          border-radius: 12px;
                          object-fit: cover;
                          border: 3px solid rgba(255,255,255,0.4);
                          background: #ffffff;
                          flex-shrink: 0;
                        }
                        .avatar-box {
                          width: 58px;
                          height: 58px;
                          border-radius: 12px;
                          background: rgba(255,255,255,0.22);
                          border: 3px solid rgba(255,255,255,0.4);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 26px;
                          font-weight: 900;
                          color: #ffffff;
                          flex-shrink: 0;
                        }
                        .badge-official {
                          background: rgba(255,255,255,0.22);
                          border: 1px solid rgba(255,255,255,0.4);
                          color: #ffffff;
                          font-size: 9px;
                          font-weight: 800;
                          letter-spacing: 1.5px;
                          text-transform: uppercase;
                          padding: 3px 12px;
                          border-radius: 20px;
                          display: inline-block;
                          margin-bottom: 4px;
                        }
                        .biz-name {
                          font-size: 22px;
                          font-weight: 900;
                          line-height: 1.1;
                          color: #ffffff;
                        }
                        .biz-sub {
                          font-size: 10px;
                          color: rgba(255,255,255,0.8);
                          margin-top: 3px;
                        }
                        .inv-pill {
                          background: rgba(255,255,255,0.25);
                          border: 1px solid rgba(255,255,255,0.4);
                          color: #ffffff;
                          font-size: 13px;
                          font-weight: 900;
                          font-family: monospace;
                          padding: 6px 16px;
                          border-radius: 20px;
                          display: inline-block;
                          margin-bottom: 4px;
                        }
                        .inv-meta {
                          font-size: 10px;
                          color: rgba(255,255,255,0.8);
                          text-align: right;
                        }
                        .body-pad {
                          padding: 20px 24px;
                        }
                        /* Tarjetas de datos */
                        .info-grid {
                          display: grid;
                          grid-template-columns: 1fr 1fr;
                          gap: 14px;
                          margin-bottom: 18px;
                        }
                        .info-card {
                          background: #f8fafc;
                          border: 1px solid #e2e8f0;
                          border-radius: 12px;
                          padding: 12px 14px;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        .card-title {
                          font-size: 9px;
                          font-weight: 900;
                          letter-spacing: 1.5px;
                          text-transform: uppercase;
                          color: #059669;
                          margin-bottom: 4px;
                        }
                        .card-main {
                          font-size: 13px;
                          font-weight: 800;
                          color: #0f172a;
                        }
                        .card-sub {
                          font-size: 11px;
                          color: #64748b;
                          margin-top: 2px;
                        }
                        /* Tabla de artículos */
                        .items-table {
                          width: 100%;
                          border-collapse: separate;
                          border-spacing: 0;
                          border: 1px solid #e2e8f0;
                          border-radius: 12px;
                          overflow: hidden;
                          margin-bottom: 18px;
                        }
                        .items-table th {
                          background: #f1f5f9;
                          color: #475569;
                          font-size: 9px;
                          font-weight: 900;
                          letter-spacing: 1px;
                          text-transform: uppercase;
                          padding: 9px 12px;
                          text-align: left;
                          border-bottom: 1px solid #e2e8f0;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        .items-table td {
                          padding: 9px 12px;
                          border-top: 1px solid #f1f5f9;
                          vertical-align: middle;
                          font-size: 11px;
                        }
                        .items-table tr:first-child td {
                          border-top: none;
                        }
                        .cant-badge {
                          display: inline-block;
                          font-weight: 900;
                          color: #0f172a;
                          background: #f1f5f9;
                          border: 1px solid #e2e8f0;
                          padding: 2px 7px;
                          border-radius: 6px;
                          font-size: 11px;
                        }
                        .prod-img {
                          width: 42px;
                          height: 42px;
                          border-radius: 8px;
                          object-fit: cover;
                          border: 1px solid #cbd5e1;
                          flex-shrink: 0;
                          background: #f8fafc;
                        }
                        .prod-avatar {
                          width: 42px;
                          height: 42px;
                          border-radius: 8px;
                          background: #f1f5f9;
                          border: 1px solid #cbd5e1;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 18px;
                          flex-shrink: 0;
                        }
                        .prod-name {
                          font-weight: 800;
                          font-size: 12px;
                          color: #0f172a;
                          line-height: 1.2;
                        }
                        .prod-sku {
                          font-family: monospace;
                          font-size: 10px;
                          color: #64748b;
                          margin-top: 2px;
                        }
                        /* Totales y QR */
                        .summary-grid {
                          display: grid;
                          grid-template-columns: 1fr 1fr;
                          gap: 16px;
                          align-items: end;
                          margin-bottom: 16px;
                        }
                        .cert-box {
                          background: #f8fafc;
                          border: 1px solid #e2e8f0;
                          border-radius: 12px;
                          padding: 12px;
                          display: flex;
                          align-items: center;
                          gap: 12px;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        .qr-code-img {
                          width: 72px;
                          height: 72px;
                          border-radius: 8px;
                          border: 1px solid #cbd5e1;
                          background: #ffffff;
                          padding: 2px;
                          flex-shrink: 0;
                        }
                        .totals-wrap {
                          display: flex;
                          flex-direction: column;
                          gap: 4px;
                        }
                        .tot-line {
                          display: flex;
                          justify-content: space-between;
                          font-size: 11px;
                          color: #475569;
                        }
                        .tot-line strong {
                          color: #0f172a;
                          font-family: monospace;
                        }
                        .tot-final-bar {
                          background: linear-gradient(135deg, #064e3b 0%, #047857 100%) !important;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                          color: #ffffff;
                          padding: 10px 14px;
                          border-radius: 10px;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          font-size: 13px;
                          font-weight: 900;
                          margin-top: 6px;
                        }
                        .footer-text {
                          text-align: center;
                          font-size: 10px;
                          color: #64748b;
                          font-style: italic;
                          border-top: 1px solid #e2e8f0;
                          padding-top: 12px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="invoice-container">
                        <!-- Cabecera Oficial -->
                        <div class="header-banner">
                          <div style="display: flex; align-items: center; gap: 14px;">
                            ${activeBusiness?.logo_url ? `
                              <img src="${activeBusiness.logo_url}" alt="Logo" class="logo-box" />
                            ` : `
                              <div class="avatar-box">
                                ${(activeBusiness?.name || 'K').charAt(0).toUpperCase()}
                              </div>
                            `}
                            <div>
                              <div class="badge-official">
                                Factura Oficial · ${(activeBusiness?.name || 'Mi Negocio').toUpperCase()}
                              </div>
                              <div class="biz-name">
                                ${activeBusiness?.name || 'Mi Negocio'}
                              </div>
                              <div class="biz-sub">
                                ${activeBusiness?.address ? activeBusiness.address + (activeBusiness.city ? ' · ' + activeBusiness.city : '') + ' · ' : ''}
                                ${activeBusiness?.phone ? 'Tel: ' + activeBusiness.phone : 'Comprobante Oficial de Entrega'}
                              </div>
                            </div>
                          </div>

                          <div style="text-align: right; flex-shrink: 0;">
                            <div class="inv-pill">
                              ${completedSale.invoice_number}
                            </div>
                            <div class="inv-meta">
                              ${dateStr} · ${timeStr}
                            </div>
                          </div>
                        </div>

                        <!-- Cuerpo de la Factura -->
                        <div class="body-pad">
                          <!-- Grid de Datos -->
                          <div class="info-grid">
                            <div class="info-card">
                              <div class="card-title">Datos del Cliente</div>
                              <div class="card-main">${completedSale.customerName || 'Consumidor Final'}</div>
                              <div class="card-sub">NIT / CI: ${completedSale.customerNit || 'S/N'}</div>
                            </div>
                            <div class="info-card" style="text-align: right;">
                              <div class="card-title">Datos de Emisión</div>
                              <div class="card-sub">Cajero: <strong style="color: #0f172a;">${completedSale.cashierName || 'Administrador'}</strong></div>
                              <div class="card-sub">Método: <strong style="color: #0f172a; text-transform: capitalize;">${
                                completedSale.payment_method === 'cash' ? 'Efectivo' : completedSale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta'
                              }</strong></div>
                              <div class="card-sub">Estado: <strong style="color: #059669;">✓ Pagado / Confirmado</strong></div>
                            </div>
                          </div>

                          <!-- Tabla de Artículos con Foto -->
                          <table class="items-table">
                            <thead>
                              <tr>
                                <th style="width: 55px; text-align: center;">Cant.</th>
                                <th>Producto / Detalle</th>
                                <th style="width: 100px; text-align: right;">P. Unit</th>
                                <th style="width: 110px; text-align: right;">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${(completedSale.items || []).map((item: CartItem) => `
                                <tr>
                                  <td style="text-align: center;">
                                    <span class="cant-badge">${item.weightKg ? `${item.weightKg} kg` : `x${item.quantity}`}</span>
                                  </td>
                                  <td>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                      ${item.product.image_url ? `
                                        <img src="${item.product.image_url}" alt="${item.product.name}" class="prod-img" />
                                      ` : `
                                        <div class="prod-avatar">📦</div>
                                      `}
                                      <div style="min-width: 0;">
                                        <div class="prod-name">${item.product.name}</div>
                                        <div class="prod-sku">
                                          ${item.product.sku || item.product.barcode || 'PROD-' + item.product.id.slice(0, 4)}
                                          ${item.variant ? ` · 👗 Talla ${item.variant.size || ''} ${item.variant.color || ''}` : ''}
                                          ${item.tableNumber ? ` · 🍽️ ${item.tableNumber}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style="text-align: right; font-family: monospace; color: #475569;">
                                    ${formatCurrency(item.product.sale_price, currency)} ${item.weightKg ? '/kg' : ''}
                                  </td>
                                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">
                                    ${formatCurrency(item.weightKg ? item.product.sale_price * item.weightKg : item.product.sale_price * item.quantity, currency)}
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>

                          <!-- Resumen de Pago y Certificación -->
                          <div class="summary-grid">
                            <!-- QR de Verificación -->
                            <div class="cert-box">
                              <img src="${qrUrl}" alt="QR Verificación" class="qr-code-img" />
                              <div>
                                <div style="font-size: 10px; font-weight: 900; color: #0f172a;">COMPROBANTE VÁLIDO</div>
                                <div style="font-size: 9px; font-weight: 700; color: #059669; margin-top: 1px;">✓ Venta Registrada en Sistema</div>
                                <div style="font-size: 8px; color: #64748b; margin-top: 3px; line-height: 1.3;">
                                  Escanea este código para validar la autenticidad de esta nota de venta oficial.
                                </div>
                              </div>
                            </div>

                            <!-- Desglose de Totales -->
                            <div class="totals-wrap">
                              <div class="tot-line">
                                <span>Subtotal:</span>
                                <strong>${formatCurrency(completedSale.subtotal ?? completedSale.total, currency)}</strong>
                              </div>

                              ${completedSale.discountAmount > 0 ? `
                                <div class="tot-line" style="color: #dc2626;">
                                  <span>Descuento ${completedSale.discountType === 'percent' ? '(' + completedSale.discountValue + '%)' : '(Fijo)'}:</span>
                                  <strong style="color: #dc2626;">-${formatCurrency(completedSale.discountAmount, currency)}</strong>
                                </div>
                              ` : ''}

                              ${completedSale.taxAmount > 0 ? `
                                <div class="tot-line">
                                  <span>IVA (${completedSale.taxMode === 'included' ? 'Inc.' : '+' + taxPercentage + '%'}):</span>
                                  <strong>${completedSale.taxMode === 'included' ? '(' + formatCurrency(completedSale.taxAmount, currency) + ' inc.)' : '+' + formatCurrency(completedSale.taxAmount, currency)}</strong>
                                </div>
                              ` : ''}

                              ${completedSale.payment_method === 'cash' && completedSale.paid > 0 ? `
                                <div class="tot-line" style="padding-top: 4px; border-top: 1px solid #e2e8f0;">
                                  <span>Monto Recibido:</span>
                                  <strong>${formatCurrency(completedSale.paid, currency)}</strong>
                                </div>
                              ` : ''}

                              ${completedSale.payment_method === 'cash' && completedSale.change > 0 ? `
                                <div class="tot-line" style="color: #059669;">
                                  <span>Vuelto / Cambio:</span>
                                  <strong style="color: #059669;">${formatCurrency(completedSale.change, currency)}</strong>
                                </div>
                              ` : ''}

                              <div class="tot-final-bar">
                                <span>TOTAL A PAGAR:</span>
                                <span style="font-family: monospace;">${formatCurrency(completedSale.total, currency)}</span>
                              </div>
                            </div>
                          </div>

                          <!-- Pie de Factura -->
                          <div class="footer-text">
                            ${settings?.receipt_footer || '"Gracias por su preferencia — Esta nota de venta avala la entrega formal de mercadería"'}
                          </div>
                        </div>
                      </div>

                      <!-- Script de Impresión que Espera Carga de Fotos -->
                      <script>
                        window.addEventListener('load', function() {
                          var imgs = Array.from(document.images);
                          Promise.all(imgs.map(function(img) {
                            if (img.complete) return Promise.resolve();
                            return new Promise(function(resolve) {
                              img.onload = resolve;
                              img.onerror = resolve;
                            });
                          })).then(function() {
                            setTimeout(function() {
                              window.print();
                            }, 250);
                          });
                        });
                      </script>
                    </body>
                    </html>
                  `);
                  win.document.close();
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-md shadow-emerald-700/20"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Factura Color (Carta)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Balanza Electrónica */}
      <ScaleModal
        isOpen={isScaleModalOpen}
        onClose={() => {
          setIsScaleModalOpen(false);
          setPendingScaleProduct(null);
        }}
        onConfirm={(confirmedWeight) => {
          if (pendingScaleProduct) {
            addWithCustomProps(pendingScaleProduct, { weightKg: confirmedWeight });
          } else {
            setSelectedWeight(confirmedWeight);
          }
        }}
        productName={pendingScaleProduct?.name || 'Pesaje en Balanza'}
        pricePerKg={pendingScaleProduct?.sale_price || 0}
        currency={currency}
      />

      {/* Modal de Selección de Talla y Color */}
      <ClothingVariantModal
        isOpen={isClothingModalOpen}
        onClose={() => {
          setIsClothingModalOpen(false);
          setPendingClothingProduct(null);
        }}
        onConfirm={(variant) => {
          if (pendingClothingProduct) {
            addWithCustomProps(pendingClothingProduct, { variant });
          }
        }}
        productName={pendingClothingProduct?.name || 'Prenda de Vestir'}
      />
    </div>
  );
};
