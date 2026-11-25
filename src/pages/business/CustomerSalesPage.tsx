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
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { recordTrashItem } from '@/utils/trash';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon';
import type { Customer, Sale } from '@/types';
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

interface CustomerSale extends Sale {
  customer_name?: string;
  customer_nit?: string;
  customer_phone?: string;
  items?: SaleItemWithProduct[];
}

export const CustomerSalesPage: React.FC = () => {
  const { activeBusiness, settings } = useBusiness();
  const { t } = useLanguage();
  const currency = activeBusiness?.currency || 'BOB';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selección múltiple para imprimir conjunto
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());

  // Eliminación de venta
  const [saleToDelete, setSaleToDelete] = useState<CustomerSale | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        // FILTRAR SOLO COMPRAS DE CLIENTES REGISTRADOS
        const enriched: CustomerSale[] = salesRes.data
          .filter((sale: any) => {
            const cust = sale.customer;
            const audit = auditMap.get(sale.invoice_number);
            const cName = cust?.name || audit?.customer_name;
            if (!cName) return false;
            const normalized = cName.trim().toLowerCase();
            if (
              normalized === 'consumidor final' ||
              normalized === 's/n' ||
              normalized === 'sin nombre' ||
              normalized === 'cliente general' ||
              normalized === 'anonimo' ||
              normalized === 'anónimo'
            ) {
              return false;
            }
            return true;
          })
          .map((sale: any) => {
            const audit = auditMap.get(sale.invoice_number);
            const cust = sale.customer;
            return {
              ...sale,
              customer_name: cust?.name || audit?.customer_name || 'Cliente Registrado',
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
    setSelectedSaleIds(new Set());
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
      const matchNit = s.customer_nit?.toLowerCase().includes(query);
      const matchItem = s.items?.some((i) => i.product?.name?.toLowerCase().includes(query));
      return matchInvoice || matchCustomer || matchNit || matchItem;
    });
  }, [sales, selectedCustomerId, selectedCustomerObj, search]);

  const stats = useMemo(() => {
    const count = filteredSales.length;
    const revenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const average = count > 0 ? revenue / count : 0;
    return { count, revenue, average };
  }, [filteredSales]);

  // Selección múltiple
  const isAllSelected = filteredSales.length > 0 && selectedSaleIds.size === filteredSales.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSaleIds(new Set());
    } else {
      setSelectedSaleIds(new Set(filteredSales.map((s) => s.id)));
    }
  };

  const toggleSelectSale = (id: string) => {
    setSelectedSaleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const cleanPhoneForWhatsApp = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    if (clean.length === 8) {
      return `591${clean}`;
    }
    return clean;
  };

  // Formato Día de la semana + Fecha
  const formatDayAndDate = (isoDate: string) => {
    const d = new Date(isoDate);
    const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const capitalizedDay = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
    const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${capitalizedDay}, ${dateStr}`;
  };

  const formatTimeOnly = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // ── BORRAR VENTA CON REPOSICIÓN DE STOCK ──
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

      await recordTrashItem({
        businessId: activeBusiness.id,
        itemType: 'sale',
        itemId: saleToDelete.id,
        title: `Venta #${saleToDelete.invoice_number || saleToDelete.id.slice(0, 8)}`,
        subtitle: `Total: ${saleToDelete.total} · Cliente: ${saleToDelete.customer_name || 'Cliente'}`,
        payload: saleToDelete as unknown as Record<string, any>,
      });

      // 4. Registrar en auditoría
      await supabase.from('audit_logs').insert({
        business_id: activeBusiness.id,
        action: 'DELETE_SALE',
        entity: 'sales',
        details: {
          invoice_number: saleToDelete.invoice_number,
          total: saleToDelete.total,
          customer_name: saleToDelete.customer_name,
        }
      });

      // Deseleccionar si estaba marcado
      setSelectedSaleIds((prev) => {
        const next = new Set(prev);
        next.delete(saleToDelete.id);
        return next;
      });

      setSaleToDelete(null);
      await fetchData();
    } catch (err) {
      console.error('Error al borrar la venta:', err);
      alert('No se pudo eliminar la venta. Inténtalo de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  // ── IMPRESIÓN CONSOLIDADA DE VARIAS COMPRAS DEL CLIENTE ──
  const handlePrintConsolidatedReport = (salesToPrint: CustomerSale[]) => {
    if (!salesToPrint || salesToPrint.length === 0) return;

    const win = window.open('', '_blank', 'width=950,height=850');
    if (!win) return;

    const totalAmount = salesToPrint.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalItems = salesToPrint.reduce(
      (acc, s) => acc + (s.items?.reduce((ia, i) => ia + i.quantity, 0) || 0),
      0
    );

    const firstSale = salesToPrint[0];
    const clientName = selectedCustomerObj?.name || firstSale?.customer_name || 'Cliente';
    const clientNit = selectedCustomerObj?.identification || firstSale?.customer_nit || 'S/N';
    const clientPhone = selectedCustomerObj?.phone || firstSale?.customer_phone || '';

    const now = new Date();
    const emissionDate = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const emissionTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Estado de Cuenta - ${clientName}</title>
        <style>
          @page { size: letter portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.4;
            padding: 10px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #047857;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .biz-info h1 {
            font-size: 20px;
            font-weight: 900;
            color: #047857;
            text-transform: uppercase;
          }
          .biz-info p {
            font-size: 10px;
            color: #475569;
          }
          .doc-badge {
            text-align: right;
          }
          .doc-badge .title {
            font-size: 14px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-badge .date {
            font-size: 10px;
            color: #64748b;
          }
          .client-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 16px;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 10px;
          }
          .client-card .label {
            font-size: 9px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
          }
          .client-card .val {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #047857;
            color: #ffffff;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            text-align: left;
          }
          th.text-right, td.text-right {
            text-align: right;
          }
          th.text-center, td.text-center {
            text-align: center;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10.5px;
          }
          tr:nth-child(even) td {
            background: #f8fafc;
          }
          .item-pill {
            display: inline-block;
            background: #e2e8f0;
            color: #1e293b;
            padding: 1px 6px;
            border-radius: 6px;
            font-size: 9.5px;
            font-weight: 600;
            margin: 1px 2px 1px 0;
          }
          .summary-card {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
          }
          .summary-box {
            width: 280px;
            background: #ecfdf5;
            border: 1.5px solid #059669;
            border-radius: 12px;
            padding: 12px 16px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 4px;
            color: #065f46;
          }
          .summary-row.total {
            font-size: 15px;
            font-weight: 900;
            color: #064e3b;
            border-top: 1.5px dashed #059669;
            padding-top: 6px;
            margin-top: 6px;
          }
          .footer-note {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #64748b;
          }
          .sign-line {
            width: 180px;
            border-top: 1px solid #475569;
            text-align: center;
            padding-top: 4px;
            font-size: 9px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${activeBusiness?.logo_url ? `
              <img src="${activeBusiness.logo_url}" alt="Logo" style="width: 52px; height: 52px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; padding: 2px;" />
            ` : ''}
            <div class="biz-info">
              <h1>${activeBusiness?.name || 'Mi Negocio'}</h1>
              <p>${activeBusiness?.address || ''} ${activeBusiness?.city ? '· ' + activeBusiness.city : ''}</p>
              <p>${activeBusiness?.phone ? 'Tel: ' + activeBusiness.phone : ''}</p>
            </div>
          </div>
          <div class="doc-badge">
            <div class="title">Historial de Compras</div>
            <div class="date">Emisión: ${emissionDate} ${emissionTime}</div>
          </div>
        </div>

        <div class="client-card">
          <div>
            <div class="label">Cliente / Razón Social</div>
            <div class="val">${clientName}</div>
          </div>
          <div>
            <div class="label">NIT / CI</div>
            <div class="val">${clientNit}</div>
          </div>
          <div>
            <div class="label">Contacto</div>
            <div class="val">${clientPhone || 'S/N'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;" class="text-center">#</th>
              <th style="width: 110px;">Nº Factura</th>
              <th style="width: 150px;">Día & Fecha</th>
              <th>Detalle de Productos</th>
              <th style="width: 80px;" class="text-center">Pago</th>
              <th style="width: 100px;" class="text-right">Total (Bs)</th>
            </tr>
          </thead>
          <tbody>
            ${salesToPrint.map((s, idx) => {
              const d = new Date(s.created_at);
              const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
              const capDay = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
              const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

              const itemsStr = (s.items || [])
                .map((i) => `<span class="item-pill">x${i.quantity} ${i.product?.name || 'Prod'}</span>`)
                .join('');

              const methodStr = s.payment_method === 'cash' ? 'Efectivo' : s.payment_method === 'transfer' ? 'QR/Trans' : 'Tarjeta';

              return `
                <tr>
                  <td class="text-center" style="font-weight: 700; color: #64748b;">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: 800; color: #047857;">${s.invoice_number}</td>
                  <td>
                    <strong>${capDay}, ${dateStr}</strong><br/>
                    <span style="font-size: 9px; color: #64748b;">${timeStr}</span>
                  </td>
                  <td>${itemsStr || '<span style="color:#94a3b8;">Sin detalle</span>'}</td>
                  <td class="text-center" style="font-size: 9px; font-weight: 700; text-transform: uppercase;">${methodStr}</td>
                  <td class="text-right" style="font-family: monospace; font-weight: 900; font-size: 12px; color: #0f172a;">
                    ${Number(s.total || 0).toFixed(2)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="summary-card">
          <div class="summary-box">
            <div class="summary-row">
              <span>Compras Incluidas:</span>
              <strong>${salesToPrint.length} ${salesToPrint.length === 1 ? 'ticket' : 'tickets'}</strong>
            </div>
            <div class="summary-row">
              <span>Artículos Totales:</span>
              <strong>${totalItems} unidades</strong>
            </div>
            <div class="summary-row total">
              <span>TOTAL COMPRAS:</span>
              <span>Bs ${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer-note">
          <div>
            Documento de control y estado de compras emitido por ${activeBusiness?.name || 'la empresa'}.
          </div>
          <div class="sign-line">
            Firma / Sello de Conformidad
          </div>
        </div>

        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 250);
          });
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // ── IMPRESIÓN DE COMPROBANTES / FACTURAS INDIVIDUALES ──
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
        <div class="meta-row"><span>CLIENTE:</span><span>${sale.customer_name || 'Cliente'}</span></div>
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
        <title>Factura ${sale.invoice_number}</title>
        <style>
          @page { size: letter portrait; margin: 15mm 20mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; padding: 20px; font-size: 11px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #047857; padding-bottom: 14px; margin-bottom: 20px; }
          .biz-name { font-size: 22px; font-weight: 900; color: #047857; text-transform: uppercase; }
          .inv-title { font-size: 18px; font-weight: 900; text-align: right; }
          .inv-sub { font-size: 11px; color: #64748b; font-family: monospace; font-weight: bold; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: 2fr 1fr; gap: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #047857; color: #fff; font-weight: 800; text-transform: uppercase; font-size: 9px; padding: 8px 10px; text-align: left; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .total-box { margin-left: auto; width: 260px; background: #ecfdf5; border: 1.5px solid #059669; border-radius: 10px; padding: 10px 14px; }
          .total-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
          .total-row.final { font-size: 15px; font-weight: 900; color: #064e3b; border-top: 1px dashed #059669; padding-top: 6px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="biz-name">${activeBusiness?.name || 'Mi Negocio'}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${activeBusiness?.address || ''} ${activeBusiness?.city || ''}</div>
          </div>
          <div>
            <div class="inv-title">NOTA DE VENTA / FACTURA</div>
            <div class="inv-sub">Nº ${sale.invoice_number}</div>
          </div>
        </div>

        <div class="meta-box">
          <div>
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">CLIENTE / RAZÓN SOCIAL:</div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 2px;">${sale.customer_name || 'Cliente'}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">NIT / CI: ${sale.customer_nit || 'S/N'}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">FECHA Y HORA:</div>
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px;">${dateStr} ${timeStr}</div>
            <div style="font-size: 10px; color: #475569; margin-top: 2px;">Pago: ${(sale.payment_method === 'cash' ? 'Efectivo' : sale.payment_method === 'transfer' ? 'QR / Trans.' : 'Tarjeta').toUpperCase()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">CANT</th>
              <th>DESCRIPCIÓN DEL ARTÍCULO</th>
              <th style="width: 90px; text-align: right;">P. UNIT</th>
              <th style="width: 100px; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || []).map((item) => `
              <tr>
                <td style="text-align: center; font-weight: 800; color: #047857;">x${item.quantity}</td>
                <td style="font-weight: 600;">${item.product?.name || 'Producto'}</td>
                <td style="text-align: right; font-family: monospace;">${formatCurrency(item.unit_price, currency)}</td>
                <td style="text-align: right; font-family: monospace; font-weight: 800;">${formatCurrency(item.total_price || item.unit_price * item.quantity, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${qrUrl}" alt="QR" style="width: 65px; height: 65px;" />
            <div style="font-size: 9px; color: #64748b;">
              <strong style="color: #047857;">Comprobante Válido</strong><br/>
              Escanea para verificar la autenticidad
            </div>
          </div>
          <div class="total-box">
            <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(sale.subtotal, currency)}</span></div>
            ${sale.tax > 0 ? `<div class="total-row"><span>IVA:</span><span>${formatCurrency(sale.tax, currency)}</span></div>` : ''}
            <div class="total-row final"><span>TOTAL PAGADO:</span><span>${formatCurrency(sale.total, currency)}</span></div>
          </div>
        </div>

        <script>
          window.addEventListener('load', function() {
            setTimeout(function() { window.print(); }, 250);
          });
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── CABECERA PRINCIPAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/customers')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Volver a Clientes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <span>{t('customer_sales.title', 'Ventas a Clientes')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold">
                Clientes Registrados
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
              Historial y estado de compras exclusivo de clientes registrados en cartera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {filteredSales.length > 0 && (
            <button
              type="button"
              onClick={() => handlePrintConsolidatedReport(
                selectedSaleIds.size > 0
                  ? filteredSales.filter(s => selectedSaleIds.has(s.id))
                  : filteredSales
              )}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Imprimir reporte de compras"
            >
              <Printer className="w-4 h-4" />
              <span>
                {selectedSaleIds.size > 0
                  ? `Imprimir Selección (${selectedSaleIds.size})`
                  : selectedCustomerId !== 'all'
                  ? `Imprimir Historial Cliente`
                  : 'Imprimir Todo el Reporte'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/app/customers')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Directorio Clientes</span>
          </button>
        </div>
      </div>

      {/* ── TARJETAS DE MÉTRICAS (ESTILO SUCURSALES) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* 1. VENTAS REGISTRADAS (Rojo Carmesí) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-100">
              Ventas a Clientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {stats.count}
            </div>
            <p className="text-[10px] text-rose-100 font-bold mt-0.5 truncate">
              {selectedCustomerId === 'all' ? 'Compras de clientes registrados' : `Compras de ${selectedCustomerObj?.name || 'este cliente'}`}
            </p>
          </div>
        </div>

        {/* 2. TOTAL FACTURADO (Verde Esmeralda) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              Total Facturado
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono truncate">
              {formatCurrency(stats.revenue, currency)}
            </div>
            <p className="text-[10px] text-emerald-100 font-bold mt-0.5">
              Ingresos de clientes registrados
            </p>
          </div>
        </div>

        {/* 3. TICKET PROMEDIO (Azul Cobalto) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-100">
              Ticket Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono truncate">
              {formatCurrency(stats.average, currency)}
            </div>
            <p className="text-[10px] text-blue-100 font-bold mt-0.5">
              Por compra de cliente registrado
            </p>
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y SELECTOR DE CLIENTE ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, NIT/CI, N° factura o producto..."
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

        {/* Selector de Cliente */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 whitespace-nowrap">
            Filtrar Cliente:
          </span>
          <select
            value={selectedCustomerId}
            onChange={(e) => handleSelectCustomerFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-black text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[220px] truncate"
          >
            <option value="all">
              Todos los Clientes Registrados ({sales.length} ventas)
            </option>
            {customers.map((c) => {
              const count = sales.filter((s) => s.customer_id === c.id || (s.customer_name && s.customer_name.toLowerCase() === c.name.toLowerCase())).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({count} {count === 1 ? 'compra' : 'compras'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ── BARRA FLOTANTE DE ACCIÓN PARA SELECCIÓN MÚLTIPLE ── */}
      {selectedSaleIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              {selectedSaleIds.size}
            </span>
            <div>
              <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                {selectedSaleIds.size === 1 ? '1 compra seleccionada' : `${selectedSaleIds.size} compras seleccionadas`}
              </p>
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                Total acumulado: {formatCurrency(
                  filteredSales.filter((s) => selectedSaleIds.has(s.id)).reduce((acc, s) => acc + (s.total || 0), 0),
                  currency
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedSaleIds(new Set())}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
            >
              Deseleccionar
            </button>
            <button
              type="button"
              onClick={() => handlePrintConsolidatedReport(filteredSales.filter((s) => selectedSaleIds.has(s.id)))}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Seleccionadas ({selectedSaleIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TABLA PRINCIPAL DE VENTAS A CLIENTES REGISTRADOS ── */}
      <Card className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Cargando compras de clientes...
            </p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
              No hay compras de clientes registrados
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
              {selectedCustomerId !== 'all'
                ? `El cliente "${selectedCustomerObj?.name || 'seleccionado'}" aún no tiene compras registradas en el POS.`
                : 'Cuando realices ventas en el Punto de Venta (POS) asociando clientes registrados, aparecerán aquí para control, reimpresión y borrado.'}
            </p>
            {selectedCustomerId !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectCustomerFilter('all')}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Ver Todas las Compras de Clientes
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800 font-black text-[10px]">
                <tr>
                  <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      title={isAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas para imprimir'}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer text-slate-600 dark:text-zinc-300"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">N° Factura</th>
                  <th className="px-4 py-3.5">Día & Fecha</th>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Productos Vendidos</th>
                  <th className="px-4 py-3.5">Pago</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5 text-right pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                {filteredSales.map((sale) => {
                  const isSelected = selectedSaleIds.has(sale.id);

                  return (
                    <tr
                      key={sale.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectSale(sale.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-zinc-600" />
                          )}
                        </button>
                      </td>

                      {/* N° Factura */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono font-black text-slate-900 dark:text-zinc-100 text-xs border border-slate-200/80 dark:border-zinc-700">
                          {sale.invoice_number}
                        </span>
                      </td>

                      {/* Día & Fecha */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                          {formatDayAndDate(sale.created_at)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatTimeOnly(sale.created_at)}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-black text-slate-900 dark:text-zinc-100">
                              {sale.customer_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              NIT/CI: {sale.customer_nit}
                            </div>
                          </div>
                          {sale.customer_phone && (
                            <a
                              href={`https://wa.me/${cleanPhoneForWhatsApp(sale.customer_phone)}?text=${encodeURIComponent(
                                `¡Hola ${sale.customer_name}! Gracias por tu compra en ${activeBusiness?.name || 'nuestro negocio'}. Tu comprobante es ${sale.invoice_number} por un total de ${formatCurrency(sale.total, currency)}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chatear / Enviar comprobante por WhatsApp"
                              className="p-1 px-1.5 rounded-lg bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba59] hover:to-[#0f7a6e] text-white shadow-2xs hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <WhatsAppIcon className="w-3 h-3 fill-white" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Productos Vendidos */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {(sale.items || []).slice(0, 3).map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs"
                              title={`${item.quantity}x ${item.product?.name || 'Producto'}`}
                            >
                              {item.product?.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-4 h-4 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <Package className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              )}
                              <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[90px]">
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
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 font-bold text-[10px] uppercase text-slate-700 dark:text-zinc-300">
                          {sale.payment_method === 'cash' ? '💵 Efectivo' : sale.payment_method === 'transfer' ? '📱 QR/Trans.' : '💳 Tarjeta'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(sale.total, currency)}
                      </td>

                      {/* Acciones: Ver / Imprimir / Borrar */}
                      <td className="px-4 py-3.5 text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Ver Comprobante */}
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForInvoice(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-800 hover:bg-emerald-700 text-white text-[11px] font-black transition-all shadow-xs cursor-pointer"
                            title="Ver opciones de factura y tickets"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Factura</span>
                          </button>

                          {/* Botón Imprimir Ticket Rápido */}
                          <button
                            type="button"
                            onClick={() => handlePrintThermalTicket(sale, '80mm')}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
                            title="Imprimir Ticket POS (80mm)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Borrar Venta */}
                          <button
                            type="button"
                            onClick={() => setSaleToDelete(sale)}
                            className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar / Anular esta venta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── MODAL DE CONFIRMACIÓN PARA BORRAR VENTA ── */}
      {saleToDelete && (
        <Modal
          isOpen={!!saleToDelete}
          onClose={() => setSaleToDelete(null)}
          title="Eliminar / Anular Venta"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-black text-sm text-rose-900 dark:text-rose-100">
                  ¿Estás seguro de anular esta venta?
                </p>
                <p>
                  Factura: <strong className="font-mono">{saleToDelete.invoice_number}</strong>
                </p>
                <p>
                  Cliente: <strong>{saleToDelete.customer_name}</strong> · Total: <strong>{formatCurrency(saleToDelete.total, currency)}</strong>
                </p>
                <p className="text-rose-700/80 dark:text-rose-300/80 pt-1">
                  ✓ Esta acción devolverá los productos al inventario (repondrá el stock original) y registrará la anulación.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteSale}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
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

      {/* ── MODAL: VER FACTURA OFICIAL DEL CLIENTE ── */}
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
                              <div className="font-bold text-slate-900 dark:text-zinc-100">
                                {item.product?.name || 'Producto'}
                              </div>
                              {item.product?.sku && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  SKU: {item.product.sku}
                                </div>
                              )}
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
