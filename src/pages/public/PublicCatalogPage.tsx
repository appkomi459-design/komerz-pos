import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Store,
  Phone,
  MapPin,
  Clock,
  Search,
  Tag,
  CheckCircle2,
  Package,
  Building2,
  Share2,
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

export const PublicCatalogPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!businessId) {
        setError('Enlace de catálogo no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Buscar negocio por ID o por slug
        let query = supabase.from('businesses').select('*');
        // Chequear si es UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);
        if (isUuid) {
          query = query.eq('id', businessId);
        } else {
          query = query.eq('slug', businessId);
        }

        const { data: bizData, error: bizErr } = await query.maybeSingle();

        if (bizErr || !bizData) {
          setError('Negocio no encontrado');
          setLoading(false);
          return;
        }

        setBusiness(bizData as BusinessData);

        // Cargar productos activos y categorías públicas
        const [prodsRes, catsRes] = await Promise.all([
          supabase
            .from('products')
            .select('*, category:categories(name)')
            .eq('business_id', bizData.id)
            .eq('is_active', true)
            .order('name', { ascending: true }),
          supabase
            .from('categories')
            .select('id, name')
            .eq('business_id', bizData.id)
            .eq('is_active', true)
            .order('name', { ascending: true }),
        ]);

        if (prodsRes.data) setProducts(prodsRes.data as ProductItem[]);
        if (catsRes.data) setCategories(catsRes.data as CategoryItem[]);
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

            {/* COMPARTIR */}
            <button
              onClick={handleShare}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all active:scale-95 flex-shrink-0 shadow-lg"
              title="Compartir catálogo"
            >
              <Share2 className="w-5 h-5" />
            </button>
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
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-slate-700 transition-all shadow-md group"
              >
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
                        Number(p.stock) > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {Number(p.stock) > 0 ? `${p.stock} disponible` : 'Agotado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER PÚBLICO */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p className="font-bold">
          {business.name} · Catálogo Digital Oficial
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Desarrollado y certificado por <strong className="text-emerald-500">Komerz POS</strong>
        </p>
      </footer>
    </div>
  );
};
