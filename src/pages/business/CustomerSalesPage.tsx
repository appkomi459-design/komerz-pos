import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Receipt,
  Search,
  Eye,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Smartphone,
  Printer,
  X,
  MessageCircle,
  CheckCircle2,
  Store,
  Users,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Customer, Sale } from '@/types';

interface SaleItemWithProduct {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    image_url?: string | null;
    stock: number;
  };
}

interface CustomerSale extends Sale {
  customer_name?: string;
  customer_nit?: string;
  customer_phone?: string;
  items?: SaleItemWithProduct[];
}

export const CustomerSalesPage: React.FC = () => {
  const { activeBusiness, settings } = useBusiness();
  const currency = activeBusiness?.currency || 'BOB';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Filtro de cliente seleccionado (desde query params o dropdown)
  const selectedCustomerId = searchParams.get('customer') || 'all';

  // Modal Factura
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<CustomerSale | null>(null);

  const fetchData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);

      const [custRes, salesRes, auditRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('name', { ascending: true }),

        supabase
          .from('sales')
          .select(`
            *,
            customer:customers(*),
            items:sale_items(
              id,
              sale_id,
              product_id,
              quantity,
              unit_price,
              total_price,
              product:products(
                id,
                name,
                sku,
                barcode,
                image_url,
                stock
              )
            )
          `)
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('audit_logs')
          .select('details')
          .eq('business_id', activeBusiness.id)
          .eq('action', 'CREATE_SALE')
      ]);

      if (custRes.data) {
        setCustomers(custRes.data as Customer[]);
      }

      const auditMap = new Map<string, any>();
      if (auditRes.data) {
        auditRes.data.forEach((log: any) => {
          if (log.details?.invoice_number) {
            auditMap.set(log.details.invoice_number, log.details);
          }
        });
      }

      if (salesRes.data) {
        const enriched: CustomerSale[] = salesRes.data.map((sale: any) => {
          const audit = auditMap.get(sale.invoice_number);
          const cust = sale.customer;
          return {
            ...sale,
            customer_name: cust?.name || audit?.customer_name || 'Consumidor Final',
            customer_nit: cust?.identification || audit?.customer_nit || 'S/N',
            customer_phone: cust?.phone || null,
          };
        });
        setSales(enriched);
      }
    } catch (err) {
      console.error('Error cargando ventas a clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBusiness]);

  const handleSelectCustomerFilter = (id: string) => {
    if (id === 'all') {
      searchParams.delete('customer');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ customer: id });
    }
  };

  const selectedCustomerObj = useMemo(() => {
    if (selectedCustomerId === 'all') return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Filtro por cliente
      if (selectedCustomerId !== 'all') {
        const isMatched =
          s.customer_id === selectedCustomerId ||
          (s.customer_name &&
            selectedCustomerObj &&
            s.customer_name.toLowerCase() === selectedCustomerObj.name.toLowerCase());
        if (!isMatched) return false;
      }

      // Filtro por texto
      const query = search.toLowerCase().trim();
      if (!query) return true;

      const matchInvoice = s.invoice_number.toLowerCase().includes(query);
      const matchCustomer = s.customer_name?.toLowerCase().includes(query);
      const matchItem = s.items?.some((i) => i.product?.name?.toLowerCase().includes(query));
      return matchInvoice || matchCustomer || matchItem;
    });
  }, [sales, selectedCustomerId, selectedCustomerObj, search]);

  const stats = useMemo(() => {
    const count = filteredSales.length;
    const revenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const average = count > 0 ? revenue / count : 0;
    return { count, revenue, average };
  }, [filteredSales]);

  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    if (clean.length === 8) {
      return `591${clean}`;
    }
    return clean;
  };

  // ── IMPRESIÓN DE COMPROBANTES / FACTURAS ──
  const handlePrintThermalTicket = (sale: CustomerSale, format: '58mm' | '80mm' = '80mm') => {
    const is58 = format === '58mm';
    const win = window.open('', '_blank', `width=${is58 ? 340 : 420},height=750`);
    if (!win) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${is58 ? '100x100' : '120x120'}&data=${encodeURIComponent(
      (typeof window !== 'undefined' ? window.location.origin : '') + '/factura/' + sale.invoice_number
    )}`;
    const saleDate = new Date(sale.created_at);
    const dateStr = saleDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = saleDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Ticket POS ${format} - ${sale.invoice_number}</title>
        <style>
          @page { size: ${is58 ? '58mm auto' : '80mm auto'}; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Courier New', Courier, monospace; font-size: ${is58 ? '10px' : '11px'}; line-height: 1.3; color: #000; background: #fff; width: ${is58 ? '48mm' : '76mm'}; max-width: ${is58 ? '48mm' : '76mm'}; margin: 0 auto; padding: ${is58 ? '4mm 2mm 8mm 2mm' : '6mm 4mm 14mm 4mm'}; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .biz-name { font-size: ${is58 ? '13px' : '15px'}; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }
          .biz-sub { font-size: ${is58 ? '8.5px' : '10px'}; color: #333; margin-bottom: 1px; }
          .divider-double { border-top: 1px dashed #000; border-bottom: 1px dashed #000; height: 3px; margin: 5px 0; }
          .divider-single { border-top: 1px dashed #000; margin: 4px 0; }
          .meta-row { display: flex; justify-content: space-between; font-size: ${is58 ? '8.5px' : '10px'}; margin-bottom: 2px; }
          .items-header { display: flex; justify-content: space-between; font-weight: bold; font-size: ${is58 ? '8.5px' : '10px'}; padding: 2px 0; }
          .item-block { margin-bottom: 4px; }
          .item-title { font-weight: bold; font-size: ${is58 ? '10px' : '11px'}; word-break: break-word; }
          .item-calc { display: flex; justify-content: space-between; font-size: ${is58 ? '8.5px' : '10px'}; padding-left: 4px; color: #222; }
          .tot-row { display: flex; justify-content: space-between; font-size: ${is58 ? '9.5px' : '11px'}; margin-bottom: 2px; }
          .total-banner { font-size: ${is58 ? '12px' : '14px'}; font-weight: 900; display: flex; justify-content: space-between; padding: 3px 0; }
          .qr-box { margin: 6px auto 3px auto; text-align: center; }
          .qr-img { width: ${is58 ? '56px' : '72px'}; height: ${is58 ? '56px' : '72px'}; display: inline-block; }
          .footer-note { text-align: center; font-size: ${is58 ? '8px' : '9px'}; margin-top: 5px; line-height: 1.25; }
          .cut-space { height: 18px; }
        </style>
      </head>
      <body>
        <div class="text-center bold biz-name">${activeBusiness?.name || 'MI NEGOCIO'}</div>
        ${activeBusiness?.address ? `<div class="text-center biz-sub">${activeBusiness.address}${activeBusiness.city ? ' - ' + activeBusiness.city : ''}</div>` : ''}
        ${activeBusiness?.phone ? `<div class="text-center biz-sub">Tel: ${activeBusiness.phone}</div>` : ''}
        <div class="divider-double"></div>
        <div class="meta-row"><span>TICKET Nº:</span><span class="bold">${sale.invoice_number}</span></div>
        <div class="meta-row"><span>FECHA:</span><span>${dateStr} ${timeStr}</span></div>
        <div class="meta-row"><span>CLIENTE:</span><span>${sale.customer_name || 'Consumidor Final'}</span></div>
        <div class="meta-row"><span>NIT/CI:</span><span>${sale.customer_nit || 'S/N'}</span></div>
        <div class="meta-row"><span>PAGO:</span><span class="bold">${(sale.payment_method === 'cash' ? 'Efectivo' : sale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta').toUpperCase()}</span></div>
        <div class="divider-single"></div>
        <div class="items-header"><span>CANT. ARTÍCULO</span><span>TOTAL</span></div>
        <div class="divider-single"></div>
        ${(sale.items || []).map((item) => `
          <div class="item-block">
            <div class="item-title">x${item.quantity} ${item.product?.name || 'Producto'}</div>
            <div class="item-calc">
              <span>${formatCurrency(item.unit_price, currency)} c/u</span>
              <span class="bold">${formatCurrency(item.total_price || item.unit_price * item.quantity, currency)}</span>
            </div>
          </div>
        `).join('')}
        <div class="divider-single"></div>
        <div class="tot-row"><span>Subtotal:</span><span>${formatCurrency(sale.subtotal, currency)}</span></div>
        ${sale.tax > 0 ? `<div class="tot-row"><span>IVA:</span><span>${formatCurrency(sale.tax, currency)}</span></div>` : ''}
        <div class="divider-double"></div>
        <div class="total-banner"><span>TOTAL PAGADO:</span><span>${formatCurrency(sale.total, currency)}</span></div>
        <div class="divider-double"></div>
        <div class="qr-box">
          <img src="${qrUrl}" alt="QR" class="qr-img" />
          <div style="font-size: 8px; margin-top: 2px;">COMPROBANTE VÁLIDO</div>
        </div>
        <div class="footer-note">${settings?.receipt_footer || '¡Gracias por su preferencia! Conserve este comprobante.'}</div>
        <div class="cut-space"></div>
        <script>
          window.addEventListener('load', function() {
            var imgs = Array.from(document.images);
            Promise.all(imgs.map(function(img) {
              if (img.complete) return Promise.resolve();
              return new Promise(function(resolve) { img.onload = resolve; img.onerror = resolve; });
            })).then(function() { setTimeout(function() { window.print(); }, 200); });
          });
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handlePrintFormalInvoice = (sale: CustomerSale) => {
    const win = window.open('', '_blank', 'width=950,height=800');
    if (!win) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
      (typeof window !== 'undefined' ? window.location.origin : '') + '/factura/' + sale.invoice_number
    )}`;
    const saleDate = new Date(sale.created_at);
    const dateStr = saleDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = saleDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Factura ${sale.invoice_number} - ${activeBusiness?.name || 'Komerz POS'}</title>
        <style>
          @page { size: letter portrait; margin: 10mm 12mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #1e293b; font-size: 12px; line-height: 1.4; padding: 8px; }
          .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 16px; overflow: hidden; }
          .header-banner { background: linear-gradient(135deg, #064e3b 0%, #047857 60%, #0f766e 100%) !important; color: #ffffff !important; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
          .biz-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
          .biz-sub { font-size: 11px; opacity: 0.9; margin-top: 3px; }
          .inv-pill { background: rgba(255,255,255,0.18) !important; border: 1px solid rgba(255,255,255,0.3) !important; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 900; font-family: monospace; }
          .inv-meta { font-size: 11px; opacity: 0.85; margin-top: 4px; }
          .body-pad { padding: 22px 28px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .info-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 12px; padding: 12px 16px; }
          .card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px; }
          .card-main { font-size: 14px; font-weight: 900; color: #0f172a; }
          .card-sub { font-size: 11px; color: #475569; margin-top: 2px; }
          .items-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 18px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
          .items-table th { background: #f1f5f9 !important; color: #475569; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; }
          .items-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
          .prod-img { width: 34px; height: 34px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; flex-shrink: 0; }
          .totals-wrap { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; }
          .qr-area { display: flex; align-items: center; gap: 12px; background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 12px; padding: 10px 14px; }
          .qr-img { width: 70px; height: 70px; border-radius: 6px; }
          .totals-table { width: 280px; }
          .tot-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569; }
          .tot-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #064e3b; padding-top: 8px; margin-top: 6px; border-top: 2px solid #cbd5e1; }
          .footer-note { text-align: center; font-size: 10px; color: #64748b; font-style: italic; margin-top: 22px; padding-top: 12px; border-top: 1px dashed #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header-banner">
            <div>
              <div class="biz-title">${activeBusiness?.name || 'MI NEGOCIO'}</div>
              <div class="biz-sub">${activeBusiness?.address ? activeBusiness.address + ' · ' : ''}${activeBusiness?.phone ? 'Tel: ' + activeBusiness.phone : 'Comprobante Oficial'}</div>
            </div>
            <div style="text-align: right;">
              <div class="inv-pill">${sale.invoice_number}</div>
              <div class="inv-meta">${dateStr} · ${timeStr}</div>
            </div>
          </div>
          <div class="body-pad">
            <div class="info-grid">
              <div class="info-card">
                <div class="card-title">Datos del Cliente</div>
                <div class="card-main">${sale.customer_name || 'Consumidor Final'}</div>
                <div class="card-sub">NIT / CI: ${sale.customer_nit || 'S/N'}</div>
              </div>
              <div class="info-card" style="text-align: right;">
                <div class="card-title">Datos de Emisión</div>
                <div class="card-sub">Cajero: <strong>Administrador</strong></div>
                <div class="card-sub">Método: <strong style="text-transform: capitalize;">${sale.payment_method === 'cash' ? 'Efectivo' : sale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta'}</strong></div>
                <div class="card-sub">Estado: <strong style="color: #059669;">✓ Venta Confirmada</strong></div>
              </div>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">Cant.</th>
                  <th>Producto / Detalle</th>
                  <th style="width: 100px; text-align: right;">P. Unit</th>
                  <th style="width: 110px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${(sale.items || []).map((item) => `
                  <tr>
                    <td style="text-align: center; font-weight: bold;">x${item.quantity}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        ${item.product?.image_url ? `<img src="${item.product.image_url}" alt="${item.product.name}" class="prod-img" />` : ''}
                        <div>
                          <div style="font-weight: bold; color: #0f172a;">${item.product?.name || 'Producto'}</div>
                          <div style="font-size: 10px; color: #64748b;">${item.product?.sku || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align: right; font-family: monospace;">${formatCurrency(item.unit_price, currency)}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatCurrency(item.total_price || item.unit_price * item.quantity, currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals-wrap">
              <div class="qr-area">
                <img src="${qrUrl}" alt="QR" class="qr-img" />
                <div>
                  <div style="font-size: 11px; font-weight: 800; color: #064e3b;">Comprobante Válido</div>
                  <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Escanea para verificar</div>
                </div>
              </div>
              <div class="totals-table">
                <div class="tot-row"><span>Subtotal:</span><span>${formatCurrency(sale.subtotal, currency)}</span></div>
                ${sale.tax > 0 ? `<div class="tot-row"><span>IVA:</span><span>${formatCurrency(sale.tax, currency)}</span></div>` : ''}
                <div class="tot-final"><span>TOTAL PAGADO:</span><span>${formatCurrency(sale.total, currency)}</span></div>
              </div>
            </div>
            <div class="footer-note">${settings?.receipt_footer || '¡Gracias por su preferencia! Esta factura avala la compra.'}</div>
          </div>
        </div>
        <script>
          window.addEventListener('load', function() {
            var imgs = Array.from(document.images);
            Promise.all(imgs.map(function(img) {
              if (img.complete) return Promise.resolve();
              return new Promise(function(resolve) { img.onload = resolve; img.onerror = resolve; });
            })).then(function() { setTimeout(function() { window.print(); }, 250); });
          });
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-700/20">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Registro de Ventas a Clientes
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 pl-10">
            Historial de facturas y notas de venta emitidas a clientes, con detalle de productos y comprobante
          </p>
        </div>

        {/* Botón Acceso Rápido a Clientes */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/app/customers')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Ir a Directorio de Clientes</span>
          </button>
        </div>
      </div>

      {/* ── TARJETAS DE MÉTRICAS (KPIS VIBRANTES CON GRADIENTES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. VENTAS REGISTRADAS (Rojo Carmesí) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#eb3349] to-[#f45c43] text-white shadow-xl shadow-rose-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Historial
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <rect x="22" y="16" width="28" height="40" rx="3" stroke="white" strokeWidth="3" fill="none"/>
              <line x1="28" y1="26" x2="44" y2="26" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="28" y1="34" x2="44" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="28" y1="42" x2="38" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-xs relative z-10 font-mono">
            {stats.count}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            Ventas Registradas
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {selectedCustomerId === 'all' ? 'Facturas emitidas a clientes' : 'Compras de este cliente'}
          </p>
        </div>

        {/* 2. TOTAL FACTURADO (Verde Esmeralda) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Ingresos
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <polyline points="16,52 26,38 36,42 46,28 56,20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="56" cy="20" r="4" fill="white"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
            {formatCurrency(stats.revenue, currency)}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            Total Facturado
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            Ingresos acumulados de clientes
          </p>
        </div>

        {/* 3. TICKET PROMEDIO (Azul Cobalto) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#2980b9] to-[#2c3e50] text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Promedio
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <circle cx="36" cy="36" r="20" stroke="white" strokeWidth="3" strokeDasharray="4 4" fill="none"/>
              <circle cx="36" cy="36" r="6" fill="white"/>
            </svg>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
            {formatCurrency(stats.average, currency)}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            Ticket Promedio
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            Por transacción de cliente
          </p>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y SELECTOR DE CLIENTE ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° factura o producto vendido..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filtro por Cliente */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
            Filtrar Cliente:
          </span>
          <select
            value={selectedCustomerId}
            onChange={(e) => handleSelectCustomerFilter(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs max-w-[220px]"
          >
            <option value="all">Todos los Clientes ({sales.length} ventas)</option>
            {customers.map((c) => {
              const count = sales.filter((s) => s.customer_id === c.id || s.customer_name?.toLowerCase() === c.name.toLowerCase()).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({count} ventas)
                </option>
              );
            })}
          </select>
        </div>

        {/* Pill de Filtro Activo */}
        {selectedCustomerId !== 'all' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span>Cliente: <strong>{selectedCustomerObj?.name}</strong></span>
            <button
              type="button"
              onClick={() => handleSelectCustomerFilter('all')}
              className="hover:text-emerald-950 font-black ml-1 cursor-pointer"
              title="Quitar filtro"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── TABLA DE VENTAS A CLIENTES ── */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Cargando registro de ventas a clientes...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
              No se encontraron ventas
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
              {selectedCustomerId !== 'all'
                ? `El cliente "${selectedCustomerObj?.name || 'seleccionado'}" aún no tiene compras registradas.`
                : 'Realiza ventas desde el Punto de Venta (POS) asociando clientes para ver su registro aquí.'}
            </p>
            {selectedCustomerId !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectCustomerFilter('all')}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Ver Ventas de Todos los Clientes
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800 font-black text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">N° Factura</th>
                  <th className="px-5 py-3.5">Fecha & Hora</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Productos Vendidos</th>
                  <th className="px-5 py-3.5">Método de Pago</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* N° Factura */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-black text-slate-900 dark:text-zinc-100 text-xs">
                        {sale.invoice_number}
                      </span>
                    </td>

                    {/* Fecha & Hora */}
                    <td className="px-5 py-3.5 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">
                        {formatDate(sale.created_at)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-5 py-3.5">
                      <div className="font-black text-slate-900 dark:text-zinc-100">
                        {sale.customer_name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        NIT: {sale.customer_nit}
                      </div>
                    </td>

                    {/* Productos Vendidos */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {(sale.items || []).slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs"
                            title={`${item.quantity}x ${item.product?.name || 'Producto'}`}
                          >
                            {item.product?.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-5 h-5 rounded-md object-cover flex-shrink-0"
                              />
                            ) : (
                              <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[100px]">
                              {item.product?.name || 'Prod'}
                            </span>
                            <span className="text-[9px] font-black px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                        {(sale.items || []).length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            +{(sale.items || []).length - 3} más
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Método de Pago */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 font-bold text-[10px] uppercase text-slate-700 dark:text-zinc-300">
                        {sale.payment_method === 'cash' ? '💵 Efectivo' : sale.payment_method === 'transfer' ? '📱 QR/Trans.' : '💳 Tarjeta'}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-3.5 font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(sale.total, currency)}
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>COMPLETADA</span>
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sale.customer_phone && (
                          <a
                            href={`https://wa.me/${cleanPhoneForWhatsApp(sale.customer_phone)}?text=${encodeURIComponent(
                              `¡Hola ${sale.customer_name}! Gracias por tu compra en ${activeBusiness?.name || 'nuestro negocio'}. Tu comprobante es ${sale.invoice_number} por un total de ${formatCurrency(sale.total, currency)}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Enviar comprobante por WhatsApp al cliente"
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-emerald-600" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSaleForInvoice(sale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-emerald-700 text-white text-[11px] font-black transition-all shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Factura</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* MODAL: VER FACTURA OFICIAL DEL CLIENTE                   */}
      {/* ======================================================== */}
      {selectedSaleForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 p-6 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    <Store className="w-6 h-6 text-emerald-300" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-emerald-200 mb-1">
                      Factura Oficial · {activeBusiness?.name || 'Komerz POS'}
                    </span>
                    <h3 className="text-xl font-black tracking-tight text-white leading-none">
                      {activeBusiness?.name || 'Mi Negocio'}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-mono font-black text-xs border border-white/20">
                    {selectedSaleForInvoice.invoice_number}
                  </div>
                  <div className="text-[10px] text-emerald-200/80 font-medium mt-1">
                    {new Date(selectedSaleForInvoice.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Datos del Cliente
                  </span>
                  <div className="font-black text-slate-900 dark:text-zinc-100 mt-0.5">
                    {selectedSaleForInvoice.customer_name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    NIT / CI: {selectedSaleForInvoice.customer_nit}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Datos de Emisión
                  </span>
                  <div className="font-bold text-slate-700 dark:text-zinc-300 mt-0.5">
                    Cajero: <strong>Administrador</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Método:{' '}
                    <strong className="text-slate-800 dark:text-zinc-200 capitalize">
                      {selectedSaleForInvoice.payment_method === 'cash' ? 'Efectivo' : selectedSaleForInvoice.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800 text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="py-2 px-3 text-center w-12">Cant.</th>
                      <th className="py-2 px-3">Producto</th>
                      <th className="py-2 px-3 text-right">P. Unit</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {(selectedSaleForInvoice.items || []).map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2.5 px-3 text-center font-black text-emerald-700 dark:text-emerald-400">
                          x{item.quantity}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {item.product?.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-zinc-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 dark:text-zinc-200">
                                {item.product?.name || 'Producto'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {item.product?.sku || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(item.unit_price, currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {formatCurrency(item.total_price || item.unit_price * item.quantity, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                      (typeof window !== 'undefined' ? window.location.origin : '') + '/factura/' + selectedSaleForInvoice.invoice_number
                    )}`}
                    alt="QR"
                    className="w-12 h-12 rounded-lg"
                  />
                  <div>
                    <span className="text-[9px] font-black uppercase text-emerald-600 block">
                      ✓ Comprobante Válido
                    </span>
                    <span className="text-[8px] text-slate-400">Escanea para verificar</span>
                  </div>
                </div>

                <div className="w-48 space-y-1 text-right">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedSaleForInvoice.subtotal, currency)}</span>
                  </div>
                  {selectedSaleForInvoice.tax > 0 && (
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>IVA:</span>
                      <span className="font-mono">{formatCurrency(selectedSaleForInvoice.tax, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-zinc-700">
                    <span>TOTAL:</span>
                    <span className="font-mono">{formatCurrency(selectedSaleForInvoice.total, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSaleForInvoice(null)}
                className="py-2.5 rounded-xl border-2 border-slate-200 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => handlePrintThermalTicket(selectedSaleForInvoice, '58mm')}
                className="py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-emerald-400 border border-slate-700 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-800 transition-colors"
                title="Para mini impresoras térmicas de bolsillo (58mm)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Ticket Mini (58mm)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintThermalTicket(selectedSaleForInvoice, '80mm')}
                className="py-2.5 rounded-xl bg-slate-800 dark:bg-zinc-700 text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-700 transition-colors"
                title="Para impresoras térmicas de mostrador (80mm)"
              >
                <Receipt className="w-3.5 h-3.5 text-blue-400" />
                <span>Ticket POS (80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintFormalInvoice(selectedSaleForInvoice)}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-md shadow-emerald-700/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Factura Carta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
