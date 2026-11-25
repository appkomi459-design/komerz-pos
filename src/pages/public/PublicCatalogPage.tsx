import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Store,
  Phone,
  MapPin,
  Search,
  CheckCircle2,
  Package,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  MessageCircle,
} from 'lucide-react';

interface BusinessData {
  id: string;
  name: string;
  slug: string | null;
  business_type: string;
  logo_url: string | null;
  cover_url: string | null;
  country: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock: number;
  unit: string | null;
  image_url: string | null;
  category_id: string | null;
  category?: { name: string } | null;
  is_active: boolean;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export const PublicCatalogPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrito de compras público
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!businessId) {
        setError('Enlace de catálogo no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: catalogData, error: rpcErr } = await supabase.rpc('get_public_catalog', {
          p_identifier: businessId,
        });

        if (rpcErr || !catalogData || !catalogData.business) {
          setError('Negocio no encontrado');
          setLoading(false);
          return;
        }

        setBusiness(catalogData.business as BusinessData);
        setProducts((catalogData.products || []) as ProductItem[]);
        setCategories((catalogData.categories || []) as CategoryItem[]);
      } catch (err: any) {
        console.error('Error cargando catálogo público:', err);
        setError('Ocurrió un error al cargar la información del negocio.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [businessId]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCat =
      selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const formatMoney = (val: number) => {
    const curr = business?.currency === 'USD' ? '$' : 'Bs ';
    return `${curr}${Number(val || 0).toFixed(2)}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business?.name || 'Catálogo Digital',
        text: `Conoce el catálogo de precios y productos de ${business?.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace del catálogo copiado al portapapeles!');
    }
  };

  const getCartQuantity = (productId: string) =>
    cart.find((item) => item.product.id === productId)?.quantity || 0;

  const addToCart = (product: ProductItem) => {
    if (Number(product.stock) <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= Number(product.stock)) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > Number(item.product.stock)) return item;
          return { ...item, quantity: nextQty };
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce(
    (acc, item) => acc + Number(item.product.sale_price) * item.quantity,
    0
  );

  const handleSendWhatsAppOrder = () => {
    if (!business?.phone || cart.length === 0) return;
    const cleanPhone = business.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return;

    const lines = [
      `Hola *${business.name}*, quiero realizar el siguiente pedido:`,
      '',
      ...cart.map(
        (item, idx) =>
          `${idx + 1}. *${item.product.name}* x${item.quantity} (${formatMoney(
            item.product.sale_price
          )} c/u) = *${formatMoney(Number(item.product.sale_price) * item.quantity)}*`
      ),
      '',
      `*TOTAL: ${formatMoney(cartTotal)}*`,
    ];

    if (customerName.trim()) {
      lines.push('', `Cliente: ${customerName.trim()}`);
    }
    if (customerNote.trim()) {
      lines.push(`Nota / Dirección: ${customerNote.trim()}`);
    }

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-black tracking-wider uppercase">Cargando Catálogo Digital...</h2>
        <p className="text-xs text-slate-400 mt-1">Komerz POS · Sistema de Ventas</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <Store className="w-16 h-16 text-slate-600 mb-4" />
        <h1 className="text-xl font-black">Catálogo No Disponible</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">
          {error || 'No fue posible cargar el catálogo de este establecimiento.'}
        </p>
        <div className="mt-8 text-xs text-slate-500 font-bold">
          Emitido por Sistema Komerz POS
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* CABECERA CON FOTO/PORTADA Y DATOS DEL NEGOCIO */}
      <header className="relative bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* LOGO */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-800 border-2 border-emerald-500/40 p-1.5 shadow-2xl shadow-emerald-500/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-inner">
                  {business.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Catálogo Oficial Verificado
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {business.name}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {business.business_type} · Precios y existencias en tienda
              </p>

              {/* DIRECCIÓN Y TELÉFONO */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-300">
                {business.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      {business.address}
                      {business.city ? `, ${business.city}` : ''}
                    </span>
                  </div>
                )}
                {business.phone && (
                  <a
                    href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors shadow-lg shadow-emerald-600/30"
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp / Pedidos: {business.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* COMPARTIR Y CARRITO */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-3.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-lg shadow-emerald-600/25 flex items-center gap-2 font-black text-xs cursor-pointer"
                title="Ver carrito de pedido"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">Carrito</span>
                {cartCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white text-emerald-700 text-[10px] font-black leading-none">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all active:scale-95 shadow-lg cursor-pointer"
                title="Compartir catálogo"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {/* BUSCADOR */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        {/* FILTRO DE CATEGORÍAS */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((c) => {
              const count = products.filter((p) => p.category_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* LISTADO DE PRODUCTOS */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">No se encontraron artículos</p>
            <p className="text-xs mt-1">Prueba con otra palabra en el buscador</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredProducts.map((p) => {
              const qtyInCart = getCartQuantity(p.id);
              const stockAvailable = Number(p.stock);
              const isOutOfStock = stockAvailable <= 0;

              return (
                <div
                  key={p.id}
                  className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col gap-3 hover:border-slate-700 transition-all shadow-md group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* FOTO */}
                    <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700/80 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="w-7 h-7 text-slate-600" />
                      )}
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white truncate leading-snug">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {p.sku && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {p.sku}
                          </span>
                        )}
                        {p.category?.name && (
                          <span className="text-[10px] font-bold text-slate-400 truncate">
                            {p.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-base font-black text-emerald-400 tracking-tight">
                          {formatMoney(p.sale_price)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            !isOutOfStock
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {!isOutOfStock ? `${p.stock} disponible` : 'Agotado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CONTROLES DE CARRITO */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {qtyInCart === 0 ? (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(p)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          isOutOfStock
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2 bg-slate-800/90 rounded-xl p-1 border border-emerald-500/30">
                        <button
                          type="button"
                          onClick={() => updateCartQty(p.id, -1)}
                          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                          title="Quitar uno"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-center">
                          <span className="text-xs font-black text-white">{qtyInCart}</span>
                          <span className="text-[10px] text-emerald-400 font-bold ml-1.5">
                            ({formatMoney(Number(p.sale_price) * qtyInCart)})
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={qtyInCart >= stockAvailable}
                          onClick={() => updateCartQty(p.id, 1)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            qtyInCart >= stockAvailable
                              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                          }`}
                          title="Agregar uno más"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER PÚBLICO */}
      <footer className={`mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 ${cartCount > 0 ? 'pb-24' : ''}`}>
        <p className="font-bold">
          {business.name} · Catálogo Digital Oficial
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Desarrollado y certificado por <strong className="text-emerald-500">Komerz POS</strong>
        </p>
      </footer>

      {/* BARRA FLOTANTE DEL CARRITO */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-2xl shadow-emerald-600/40 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider">
                    Ver mi pedido ({cartCount} {cartCount === 1 ? 'producto' : 'productos'})
                  </p>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Toca para revisar y enviar por WhatsApp
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono">{formatMoney(cartTotal)}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER DEL CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Cabecera del modal */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Tu Pedido</h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {business.name} · {cartCount} {cartCount === 1 ? 'artículo' : 'artículos'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de productos en el carrito */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold text-slate-300">Tu carrito está vacío</p>
                  <p className="text-xs mt-1">
                    Agrega productos del catálogo para armar tu pedido
                  </p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {formatMoney(item.product.sale_price)} c/u
                        </p>
                        <p className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                          Subtotal: {formatMoney(Number(item.product.sale_price) * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= Number(item.product.stock)}
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            item.quantity >= Number(item.product.stock)
                              ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center ml-1 cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Datos opcionales del cliente */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <input
                      type="text"
                      placeholder="Tu nombre (opcional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Dirección o nota del pedido (opcional)"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer del modal con Total y Botón WhatsApp */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-800 bg-slate-950/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Total del Pedido
                  </span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {formatMoney(cartTotal)}
                  </span>
                </div>

                {business.phone ? (
                  <button
                    type="button"
                    onClick={handleSendWhatsAppOrder}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Enviar Pedido por WhatsApp</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold text-center">
                    Este negocio aún no configuró su número de WhatsApp en Configuración.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
