import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Eye,
  Trash2,
  Package,
  X,
  Store,
  AlertTriangle,
  QrCode,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Sale } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface SaleWithItems extends Sale {
  customer_name?: string;
  customer_nit?: string;
  cashier_name?: string;
  items?: SaleItemWithProduct[];
}

export const SalesPage: React.FC = () => {
  const { activeBusiness, settings } = useBusiness();
  const { t } = useLanguage();
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Color de factura / impresión — sincronizado con la configuración global
  const [printColor, setPrintColor] = useState<string>(() => {
    return localStorage.getItem('komi_print_color') || '#6d28d9';
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

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

  const activePrintColor = PRINT_COLORS.find((c) => c.hex === printColor) || PRINT_COLORS[0];

  const handleSelectPrintColor = (hex: string) => {
    setPrintColor(hex);
    localStorage.setItem('komi_print_color', hex);
    setShowColorPicker(false);
  };

  // Modales de acción
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<SaleWithItems | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currency = activeBusiness?.currency || 'BOB';

  const fetchSales = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);

      const [salesRes, auditRes] = await Promise.all([
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

      const auditMap = new Map<string, any>();
      if (auditRes.data) {
        auditRes.data.forEach((log: any) => {
          if (log.details?.invoice_number) {
            auditMap.set(log.details.invoice_number, log.details);
          }
        });
      }

      if (salesRes.data) {
        const enriched: SaleWithItems[] = salesRes.data.map((sale: any) => {
          const audit = auditMap.get(sale.invoice_number);
          return {
            ...sale,
            customer_name: sale.customer?.name || audit?.customer_name || 'Consumidor Final',
            customer_nit: sale.customer?.identification || audit?.customer_nit || 'S/N',
          };
        });
        setSales(enriched);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [activeBusiness]);

  // Manejo de eliminación / anulación de venta con reposición de inventario
  const handleDeleteSale = async () => {
    if (!saleToDelete || !activeBusiness) return;
    try {
      setDeleting(true);

      // 1. Restaurar stock de cada producto vendido
      if (saleToDelete.items && saleToDelete.items.length > 0) {
        for (const item of saleToDelete.items) {
          if (item.product_id) {
            const { data: currentProd } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .maybeSingle();

            if (currentProd) {
              const newStock = (currentProd.stock || 0) + item.quantity;
              await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.product_id);
            }
          }
        }
      }

      // 2. Eliminar items de la venta
      await supabase.from('sale_items').delete().eq('sale_id', saleToDelete.id);

      // 3. Eliminar la venta principal
      const { error } = await supabase.from('sales').delete().eq('id', saleToDelete.id);
      if (error) throw error;

      // 4. Registrar en auditoría
      await supabase.from('audit_logs').insert({
        business_id: activeBusiness.id,
        action: 'DELETE_SALE',
        entity: 'sales',
        details: {
          invoice_number: saleToDelete.invoice_number,
          total: saleToDelete.total,
          deleted_at: new Date().toISOString(),
        },
      });

      setSaleToDelete(null);
      await fetchSales();
    } catch (err: any) {
      console.error('Error deleting sale:', err);
      alert('No se pudo eliminar la venta: ' + (err?.message || 'Error desconocido'));
    } finally {
      setDeleting(false);
    }
  };

  // Impresión de Factura Formal a Color (Carta)
  const handlePrintFormalInvoice = (sale: SaleWithItems) => {
    const win = window.open('', '_blank', 'width=950,height=800');
    if (!win) return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
      (typeof window !== 'undefined' ? window.location.origin : '') + '/factura/' + sale.invoice_number
    )}`;
    const dateStr = new Date(sale.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = new Date(sale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Factura ${sale.invoice_number} - ${activeBusiness?.name || 'Komerz POS'}</title>
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
          .header-banner {
            background: ${activePrintColor.gradient} !important;
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
                ${sale.invoice_number}
              </div>
              <div class="inv-meta">
                ${dateStr} · ${timeStr}
              </div>
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
                <div class="card-sub">Cajero: <strong style="color: #0f172a;">Administrador</strong></div>
                <div class="card-sub">Método: <strong style="color: #0f172a; text-transform: capitalize;">${
                  sale.payment_method === 'cash' ? 'Efectivo' : sale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta'
                }</strong></div>
                <div class="card-sub">Estado: <strong style="color: #059669;">✓ Venta Confirmada</strong></div>
              </div>
            </div>

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
                ${(sale.items || []).map((item) => `
                  <tr>
                    <td style="text-align: center;">
                      <span class="cant-badge">x${item.quantity}</span>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        ${item.product?.image_url ? `
                          <img src="${item.product.image_url}" alt="${item.product.name}" class="prod-img" />
                        ` : `
                          <div class="prod-avatar">📦</div>
                        `}
                        <div style="min-width: 0;">
                          <div class="prod-name">${item.product?.name || 'Producto'}</div>
                          <div class="prod-sku">${item.product?.sku || item.product?.barcode || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align: right; font-family: monospace; color: #475569;">
                      ${formatCurrency(item.unit_price, currency)}
                    </td>
                    <td style="text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">
                      ${formatCurrency(item.total_price || item.unit_price * item.quantity, currency)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary-grid">
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

              <div class="totals-wrap">
                <div class="tot-line">
                  <span>Subtotal:</span>
                  <strong>${formatCurrency(sale.subtotal, currency)}</strong>
                </div>

                ${sale.tax > 0 ? `
                  <div class="tot-line">
                    <span>Impuesto (IVA):</span>
                    <strong>${formatCurrency(sale.tax, currency)}</strong>
                  </div>
                ` : ''}

                <div class="tot-final-bar">
                  <span>TOTAL A PAGAR:</span>
                  <span style="font-family: monospace;">${formatCurrency(sale.total, currency)}</span>
                </div>
              </div>
            </div>

            <div class="footer-text">
              ${settings?.receipt_footer || '"Gracias por su preferencia — Esta nota de venta avala la entrega formal de mercadería"'}
            </div>
          </div>
        </div>

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
  };

  // Impresión de Ticket Térmico POS (58mm o 80mm)
  const handlePrintThermalTicket = (sale: SaleWithItems, format: '58mm' | '80mm' = '80mm') => {
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
          @page {
            size: ${is58 ? '58mm auto' : '80mm auto'};
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
            font-size: ${is58 ? '10px' : '11px'};
            line-height: 1.3;
            color: #000000;
            background: #ffffff;
            width: ${is58 ? '48mm' : '76mm'};
            max-width: ${is58 ? '48mm' : '76mm'};
            margin: 0 auto;
            padding: ${is58 ? '4mm 2mm 8mm 2mm' : '6mm 4mm 14mm 4mm'};
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .biz-name {
            font-size: ${is58 ? '13px' : '15px'};
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
          }
          .biz-sub {
            font-size: ${is58 ? '8.5px' : '10px'};
            color: #333333;
            margin-bottom: 1px;
          }
          .divider-double {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            height: 3px;
            margin: 5px 0;
          }
          .divider-single {
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: ${is58 ? '8.5px' : '10px'};
            margin-bottom: 2px;
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: ${is58 ? '8.5px' : '10px'};
            padding: 2px 0;
          }
          .item-block {
            margin-bottom: 4px;
          }
          .item-title {
            font-weight: bold;
            font-size: ${is58 ? '10px' : '11px'};
            word-break: break-word;
          }
          .item-calc {
            display: flex;
            justify-content: space-between;
            font-size: ${is58 ? '8.5px' : '10px'};
            padding-left: 4px;
            color: #222222;
          }
          .tot-row {
            display: flex;
            justify-content: space-between;
            font-size: ${is58 ? '9.5px' : '11px'};
            margin-bottom: 2px;
          }
          .total-banner {
            font-size: ${is58 ? '12px' : '14px'};
            font-weight: 900;
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
          }
          .qr-box {
            margin: 6px auto 3px auto;
            text-align: center;
          }
          .qr-img {
            width: ${is58 ? '56px' : '72px'};
            height: ${is58 ? '56px' : '72px'};
            display: inline-block;
          }
          .footer-note {
            text-align: center;
            font-size: ${is58 ? '8px' : '9px'};
            margin-top: 5px;
            line-height: 1.25;
          }
          .cut-space {
            height: 18px;
          }
        </style>
      </head>
      <body>
        <!-- Encabezado del Negocio -->
        ${activeBusiness?.logo_url ? `
          <div style="text-align: center; margin-bottom: 6px;">
            <img src="${activeBusiness.logo_url}" alt="Logo" style="max-height: ${is58 ? '38px' : '48px'}; max-width: 80%; object-fit: contain; filter: grayscale(100%);" />
          </div>
        ` : ''}
        <div class="text-center bold biz-name">${activeBusiness?.name || 'MI NEGOCIO'}</div>
        ${activeBusiness?.address ? `<div class="text-center biz-sub">${activeBusiness.address}${activeBusiness.city ? ' - ' + activeBusiness.city : ''}</div>` : ''}
        ${activeBusiness?.phone ? `<div class="text-center biz-sub">Tel: ${activeBusiness.phone}</div>` : ''}

        <div class="divider-double"></div>

        <!-- Datos del Ticket -->
        <div class="meta-row"><span>TICKET Nº:</span><span class="bold">${sale.invoice_number}</span></div>
        <div class="meta-row"><span>FECHA:</span><span>${dateStr} ${timeStr}</span></div>
        <div class="meta-row"><span>CLIENTE:</span><span>${sale.customer_name || 'Consumidor Final'}</span></div>
        <div class="meta-row"><span>NIT/CI:</span><span>${sale.customer_nit || 'S/N'}</span></div>
        <div class="meta-row"><span>CAJERO:</span><span>${sale.cashier_name || 'Administrador'}</span></div>
        <div class="meta-row"><span>PAGO:</span><span class="bold">${(sale.payment_method === 'cash' ? 'Efectivo' : sale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta').toUpperCase()}</span></div>

        <div class="divider-single"></div>
        <div class="items-header"><span>CANT. ARTÍCULO</span><span>TOTAL</span></div>
        <div class="divider-single"></div>

        <!-- Lista de Artículos -->
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

        <!-- Totales -->
        <div class="tot-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(sale.subtotal, currency)}</span>
        </div>

        ${sale.tax > 0 ? `
          <div class="tot-row">
            <span>IVA:</span>
            <span>${formatCurrency(sale.tax, currency)}</span>
          </div>
        ` : ''}

        <div class="divider-double"></div>
        <div class="total-banner">
          <span>TOTAL PAGADO:</span>
          <span>${formatCurrency(sale.total, currency)}</span>
        </div>
        <div class="divider-double"></div>

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
  };

  // ── Period helpers ──────────────────────────────────────────────
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay()); // Sunday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredSales = sales.filter((s) => {
    // Text search
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.invoice_number.toLowerCase().includes(q) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
      (s.items && s.items.some(i => i.product?.name?.toLowerCase().includes(q)));
    if (!matchesSearch) return false;

    // Period filter
    const saleDate = new Date(s.created_at);
    if (period === 'today') return saleDate >= startOfDay;
    if (period === 'week') return saleDate >= startOfWeek;
    if (period === 'month') return saleDate >= startOfMonth;
    if (period === 'custom') {
      if (dateFrom && saleDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setDate(to.getDate() + 1); // inclusive
        if (saleDate >= to) return false;
      }
      return true;
    }
    return true; // 'all'
  });

  const totalFiltered = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('sales.title', 'Todas las Ventas')}
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('sales.subtitle', 'Historial completo de transacciones')}
            </p>
          </div>
        </div>

        {/* Stats rápidos + Color Factura */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Selector de Color de Factura */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#181615] hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Elegir color de la factura"
            >
              <span
                className="w-4 h-4 rounded-full border-2 border-white shadow-xs flex-shrink-0"
                style={{ background: activePrintColor.gradient }}
              />
              <span className="hidden sm:inline">Color Factura</span>
            </button>

            {/* Paleta desplegable de colores */}
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-zinc-700 p-4 w-72">
                <p className="text-xs font-black text-slate-700 dark:text-zinc-200 mb-3 uppercase tracking-wider">
                  🎨 Color de Encabezado de Factura
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {PRINT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
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
                  Seleccionado: <span className="text-slate-700 dark:text-zinc-200 font-black">{activePrintColor.label}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400 bg-white dark:bg-[#181615] px-3.5 sm:px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 shadow-sm">
            <Receipt className="w-4 h-4 text-emerald-500" />
            <span>{filteredSales.length} tickets</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 sm:px-4 py-2.5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
            <TrendingUp className="w-4 h-4" />
            <span>{formatCurrency(totalFiltered, currency)}</span>
          </div>
          <button
            onClick={fetchSales}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#181615] border-2 border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-emerald-600 hover:border-emerald-400 transition-all shadow-sm cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Barra de filtros unificada ── */}
      <div className="bg-white dark:bg-[#181615] rounded-2xl border-2 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Fila 1: Búsqueda + Botones periodo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('sales.search', 'Buscar por ticket, cliente o producto...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold pl-11 pr-9 py-3 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Separador + Botones de periodo */}
          <div className="flex items-center gap-1 px-3 py-2 flex-shrink-0">
            {([
              { key: 'today',  label: t('sales.filter_today',  'Hoy') },
              { key: 'week',   label: t('sales.filter_week',   'Semana') },
              { key: 'month',  label: t('sales.filter_month',  'Mes') },
              { key: 'all',    label: t('sales.filter_all',    'Todos') },
              { key: 'custom', label: '📅 ' + t('sales.filter_custom', 'Fecha') },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  period === key
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Fila 2: Rango de fechas (solo si period === 'custom') */}
        {period === 'custom' && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-t-2 border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <label className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
              {t('sales.from', 'Desde')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            <span className="text-slate-300 dark:text-zinc-600 font-black">→</span>
            <label className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
              {t('sales.to', 'Hasta')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="ml-auto text-[11px] font-black text-rose-500 hover:text-rose-700 cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                <X className="w-3 h-3" /> {t('common.clear', 'Limpiar')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabla Principal */}
      <Card className="p-0 overflow-hidden border-2 border-slate-200 dark:border-zinc-800 rounded-3xl shadow-md">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-black text-slate-500">{t('sales.loading', 'Cargando historial de ventas...')}</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-zinc-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-sm font-black text-slate-700 dark:text-zinc-300">{t('sales.no_sales', 'No se encontraron ventas.')}</p>
            <p className="text-xs font-bold mt-1 text-slate-400">
              {search ? t('sales.no_sales', 'Intenta con otro término de búsqueda.') : t('sales.no_sales', 'Realiza tu primera venta desde el Punto de Venta (Caja).')}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left table-fixed">
              <thead className="bg-slate-50 dark:bg-zinc-900 uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b-2 border-slate-200 dark:border-zinc-800 font-black text-[9px]">
                <tr>
                  <th className="px-2 py-3 w-[13%]">{t('sales.ticket', 'Ticket')}</th>
                  <th className="px-2 py-3 w-[13%]">{t('sales.date', 'Fecha')}</th>
                  <th className="px-2 py-3 w-[22%]">{t('sales.products', 'Producto')}</th>
                  <th className="px-2 py-3 w-[15%]">{t('sales.customer', 'Cliente')}</th>
                  <th className="px-2 py-3 text-center w-[9%]">{t('sales.payment', 'Pago')}</th>
                  <th className="px-2 py-3 text-right w-[10%]">{t('sales.total', 'Total')}</th>
                  <th className="px-2 py-3 text-center w-[8%]">{t('common.status', 'Estado')}</th>
                  <th className="px-2 py-3 text-right w-[10%]">{t('common.actions', 'Acción')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Factura */}
                    <td className="px-2 py-2.5 font-mono font-black text-[10px] text-slate-900 dark:text-zinc-100 overflow-hidden">
                      <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 block truncate">
                        {sale.invoice_number}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-2 py-2.5 text-[10px] font-bold text-slate-500 overflow-hidden">
                      <span className="block truncate">{formatDate(sale.created_at)}</span>
                    </td>

                    {/* Productos */}
                    <td className="px-2 py-2.5 overflow-hidden">
                      {sale.items && sale.items.length > 0 ? (
                        sale.items.length === 1 ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {sale.items[0].product?.image_url ? (
                                <img src={sale.items[0].product.image_url} alt="" className="w-full h-full object-cover"/>
                              ) : (
                                <Package className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 dark:text-zinc-100 truncate text-[10px] leading-tight">
                                {sale.items[0].product?.name || 'Producto'}
                              </p>
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                x{sale.items[0].quantity}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-2 overflow-hidden">
                              {sale.items.slice(0, 2).map((it, idx) => (
                                <div key={idx} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center overflow-hidden flex-shrink-0" title={it.product?.name}>
                                  {it.product?.image_url ? (
                                    <img src={it.product.image_url} alt="" className="w-full h-full object-cover"/>
                                  ) : (
                                    <Package className="w-3 h-3 text-slate-400"/>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] font-black text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {sale.items.length} ítems
                              </span>
                              </div>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 italic text-[9px]">—</span>
                        )}
                    </td>

                    {/* Cliente */}
                    <td className="px-2 py-2.5 overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-zinc-100 truncate leading-tight">
                        {sale.customer_name || 'Consumidor Final'}
                      </p>
                      {sale.customer_nit && sale.customer_nit !== 'S/N' && (
                        <p className="text-[9px] font-mono text-slate-400 truncate">NIT: {sale.customer_nit}</p>
                      )}
                    </td>

                    {/* Método de Pago */}
                    <td className="px-2 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        {sale.payment_method === 'cash' ? <Banknote className="w-2.5 h-2.5 text-emerald-600" /> : sale.payment_method === 'transfer' ? <Smartphone className="w-2.5 h-2.5 text-sky-600" /> : <CreditCard className="w-2.5 h-2.5 text-amber-600" />}
                        <span className="hidden sm:inline">{(sale.payment_method || '').slice(0,4)}</span>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-2 py-2.5 text-right font-black text-[11px] text-emerald-600 dark:text-emerald-400 font-mono overflow-hidden">
                      <span className="block truncate">{formatCurrency(sale.total, currency)}</span>
                    </td>

                    {/* Estado */}
                    <td className="px-2 py-2.5 text-center">
                      <span className="inline-block bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 uppercase whitespace-nowrap">
                        {sale.status === 'completed' ? 'OK' : sale.status?.slice(0,3).toUpperCase()}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-2 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(sale)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] font-black transition-all cursor-pointer active:scale-95"
                          title="Ver factura"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSaleToDelete(sale)}
                          className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer active:scale-95"
                          title="Borrar venta"
                        >
                          <Trash2 className="w-3 h-3" />
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
      {/* MODAL: VER FACTURA PROFESIONAL DE LA VENTA SELECCIONADA  */}
      {/* ======================================================== */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm p-3 sm:p-5 flex justify-center items-start sm:items-center">
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg my-auto border border-slate-200 dark:border-zinc-800 overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
            {/* Cabecera del Negocio (Fija) */}
            <div
              className="relative px-5 pt-4 pb-3.5 shrink-0 text-white shadow-md"
              style={{ background: activePrintColor.gradient }}
            >
              {/* Botón Cerrar X flotante */}
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pr-8 mb-2">
                <span className="bg-white/20 border border-white/30 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Factura Oficial · {activeBusiness?.name?.toUpperCase() || 'MI NEGOCIO'}
                </span>
                <span className="bg-white/20 border border-white/30 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                  {selectedSale.invoice_number}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {activeBusiness?.logo_url ? (
                  <div className="w-12 h-12 rounded-2xl bg-white p-1 border-2 border-white/40 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={activeBusiness.logo_url}
                      alt={activeBusiness.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black text-white leading-tight truncate">
                    {activeBusiness?.name || 'Mi Negocio'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-white/85 font-medium mt-0.5">
                    {activeBusiness?.address && (
                      <span className="truncate">{activeBusiness.address}{activeBusiness.city ? ` · ${activeBusiness.city}` : ''}</span>
                    )}
                    {activeBusiness?.phone && (
                      <span>Tel: {activeBusiness.phone}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/80 font-bold mt-1">
                    📅 {new Date(selectedSale.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {new Date(selectedSale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Cuerpo de la Factura (Con Scroll interno si es necesario) */}
            <div className="overflow-y-auto flex-1 px-5 py-3.5 space-y-3.5">
              {/* Datos Cliente & Emisión */}
              <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200/80 dark:border-zinc-700">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-0.5">Cliente</p>
                  <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate">
                    {selectedSale.customer_name || 'Consumidor Final'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                    NIT / CI: {selectedSale.customer_nit || 'S/N'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-0.5">Emisión</p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    Cajero: <span className="font-black">Administrador</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                    Método:{' '}
                    <span className="font-black capitalize">
                      {selectedSale.payment_method === 'cash' ? 'Efectivo' : selectedSale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta'}
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Estado: <span className="font-black">✓ Pagado</span>
                  </p>
                </div>
              </div>

              {/* Tabla de Productos con Fotos */}
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-100/90 dark:bg-zinc-800 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  <span className="col-span-2 text-center">Cant.</span>
                  <span className="col-span-6">Producto</span>
                  <span className="col-span-2 text-right">P. Unit</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                </div>
                {(selectedSale.items || []).map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 px-3 py-2 text-xs border-t border-slate-100 dark:border-zinc-800 items-center"
                  >
                    <span className="col-span-2 font-black text-slate-700 dark:text-zinc-300 text-center">
                      x{item.quantity}
                    </span>
                    <div className="col-span-6 flex items-center gap-2 min-w-0 pr-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.product?.image_url ? (
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
                          {item.product?.name || 'Producto'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {item.product?.sku || item.product?.barcode || ''}
                        </p>
                      </div>
                    </div>
                    <span className="col-span-2 text-right font-mono text-slate-600 dark:text-zinc-400 text-[11px]">
                      {formatCurrency(item.unit_price, currency)}
                    </span>
                    <span className="col-span-2 text-right font-black text-slate-900 dark:text-zinc-100 font-mono">
                      {formatCurrency(item.total_price || item.unit_price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales y QR */}
              <div className="flex items-end gap-3 pt-1">
                <div className="flex-shrink-0 w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center p-1">
                  <QrCode className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                  <p className="text-[7.5px] font-black text-slate-400 text-center leading-tight mt-0.5">
                    Comprobante Válido
                  </p>
                </div>

                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400 font-bold">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedSale.subtotal, currency)}</span>
                  </div>

                  {selectedSale.tax > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-zinc-500 font-bold">
                      <span>Impuesto (IVA):</span>
                      <span className="font-mono">{formatCurrency(selectedSale.tax, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-slate-900 dark:text-zinc-100 pt-1 border-t-2 border-slate-300 dark:border-zinc-700">
                    <span className="text-sm uppercase tracking-wider">Total Pagado:</span>
                    <span className="text-base font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedSale.total, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer nota */}
              <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500 font-bold italic px-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                {settings?.receipt_footer || '"Gracias por su preferencia — Esta nota de venta avala la entrega de mercadería"'}
              </p>
            </div>

            {/* Botones de Acción (Footer Fijo) */}
            <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/90 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="py-2 px-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => handlePrintThermalTicket(selectedSale, '58mm')}
                  className="py-2 px-2.5 rounded-xl bg-slate-900 dark:bg-zinc-800 text-emerald-400 border border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-800 transition-colors shrink-0"
                  title="Para mini impresoras térmicas (58mm)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ticket 58mm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintThermalTicket(selectedSale, '80mm')}
                  className="py-2 px-2.5 rounded-xl bg-slate-800 dark:bg-zinc-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-700 transition-colors shrink-0"
                  title="Para impresoras térmicas de mostrador (80mm)"
                >
                  <Receipt className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ticket 80mm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintFormalInvoice(selectedSale)}
                  className="py-2 px-3 rounded-xl text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
                  style={{ background: activePrintColor.gradient }}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Factura Color (Carta)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR BORRADO / ANULACIÓN DE LA VENTA         */}
      {/* ======================================================== */}
      {saleToDelete && (
        <Modal
          isOpen={Boolean(saleToDelete)}
          onClose={() => setSaleToDelete(null)}
          title="Eliminar Venta / Comprobante"
          className="max-w-md"
        >
          <div className="space-y-4 pt-1">
            <div className="w-14 h-14 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
                ¿Eliminar la factura {saleToDelete.invoice_number}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Esta acción eliminará el registro de la venta por un total de{' '}
                <strong className="text-slate-900 dark:text-zinc-100 font-black">
                  {formatCurrency(saleToDelete.total, currency)}
                </strong>
                .
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 font-bold space-y-1">
              <p className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Restitución automática de Inventario:</span>
              </p>
              <p className="text-[10px] leading-relaxed text-amber-800/90 dark:text-amber-300/90 pl-5">
                Las unidades de los productos vendidos serán devueltas y sumadas nuevamente al stock disponible en tu inventario.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteSale}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Borrando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Eliminar Venta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
