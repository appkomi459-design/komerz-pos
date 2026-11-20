import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Store,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Search,
  Users,
  Award,
  ArrowUpRight,
  Calendar,
  Percent,
  Printer,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';

type TimeRange = 'today' | 'week' | 'month' | 'all' | 'custom';

interface DetailedSale {
  id: string;
  user_id: string | null;
  branch_id: string | null;
  total: number;
  cost: number;
  profit: number;
  created_at: string;
}

interface SellerInfo {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  branchId?: string | null;
}

export const SellerReportsPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [search, setSearch] = useState('');

  // Color de impresión del reporte — sincronizado con la configuración global
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

  const [branches, setBranches] = useState<{ id: string; name: string; is_main: boolean }[]>([]);
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [detailedSales, setDetailedSales] = useState<DetailedSale[]>([]);

  /* ─────────────────────────── Carga de datos ─────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) return;
    try {
      setLoading(true);

      // 1. Cargar sucursales, miembros, ventas y productos en paralelo
      const [branchesRes, membersRes, salesRes, productsRes] = await Promise.all([
        supabase
          .from('branches')
          .select('id, name, is_main')
          .eq('business_id', activeBusiness.id)
          .eq('is_active', true)
          .order('is_main', { ascending: false }),
        supabase
          .from('business_members')
          .select('id, user_id, role, is_active, created_at, branch_id')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('sales')
          .select('id, user_id, branch_id, total, status, created_at')
          .eq('business_id', activeBusiness.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, cost_price, sale_price')
          .eq('business_id', activeBusiness.id),
      ]);

      const branchesData = branchesRes.data || [];
      setBranches(branchesData);

      const membersData = membersRes.data || [];
      const rawSales = salesRes.data || [];

      // 2. Obtener items de ventas para calcular costos reales y ganancias
      const saleIds = rawSales.map((s) => s.id);
      let saleItemsBySale: Record<string, { product_id: string; quantity: number }[]> = {};
      if (saleIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('sale_items')
          .select('sale_id, product_id, quantity')
          .in('sale_id', saleIds.slice(0, 500));
        (itemsData || []).forEach((it: any) => {
          if (!saleItemsBySale[it.sale_id]) saleItemsBySale[it.sale_id] = [];
          saleItemsBySale[it.sale_id].push({
            product_id: it.product_id,
            quantity: Number(it.quantity) || 1,
          });
        });
      }

      // Mapa de costo de productos
      const productCostMap: Record<string, number> = {};
      (productsRes.data || []).forEach((p: any) => {
        productCostMap[p.id] = Number(p.cost_price) || 0;
      });

      // 3. Procesar ventas con ganancia
      const processedSales: DetailedSale[] = rawSales.map((s: any) => {
        const items = saleItemsBySale[s.id] || [];
        let totalCost = 0;
        if (items.length > 0) {
          items.forEach((it) => {
            const cost = productCostMap[it.product_id] || 0;
            totalCost += cost * it.quantity;
          });
        }
        const total = Number(s.total) || 0;
        const profit = items.length > 0 && totalCost > 0 ? Math.max(0, total - totalCost) : Math.max(0, total * 0.4);
        return {
          id: s.id,
          user_id: s.user_id,
          branch_id: s.branch_id,
          total,
          cost: totalCost,
          profit,
          created_at: s.created_at,
        };
      });
      setDetailedSales(processedSales);

      // 4. Buscar nombres de los vendedores en profiles
      const userIds = membersData.map((m: any) => m.user_id).filter(Boolean);
      let profilesById: Record<string, { full_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        (profilesData || []).forEach((p: any) => {
          profilesById[p.id] = { full_name: p.full_name, email: p.email };
        });
      }

      // 5. Mapear info de vendedores
      const mappedSellers: SellerInfo[] = membersData.map((m: any) => {
        const prof = profilesById[m.user_id] || { full_name: '', email: '' };
        return {
          userId: m.user_id,
          fullName: prof.full_name || 'Vendedor',
          email: prof.email || '—',
          role: m.role,
          branchId: m.branch_id || null,
        };
      });
      setSellers(mappedSellers);

    } catch (err) {
      console.error('Error cargando reporte de vendedores:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─────────────────── Reporte Calculado por Sucursal ─────────────────── */
  const report = useMemo(() => {
    const now = new Date();
    const isToday = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toDateString() === now.toDateString();
    };
    const isThisWeek = (dateStr: string) => {
      const d = new Date(dateStr);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    };
    const isThisMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    // 1. Filtrar ventas por rango de tiempo
    const filtered = detailedSales.filter((s) => {
      if (timeRange === 'today') return isToday(s.created_at);
      if (timeRange === 'week') return isThisWeek(s.created_at);
      if (timeRange === 'month') return isThisMonth(s.created_at);
      if (timeRange === 'custom') {
        if (!dateFrom && !dateTo) return true;
        const saleDate = new Date(s.created_at);
        if (dateFrom) {
          const from = new Date(dateFrom + 'T00:00:00');
          if (saleDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo + 'T23:59:59.999');
          if (saleDate > to) return false;
        }
        return true;
      }
      return true;
    });

    const periodTotalSales = filtered.reduce((acc, s) => acc + s.total, 0);
    const periodTotalCost = filtered.reduce((acc, s) => acc + s.cost, 0);
    const periodTotalProfit = filtered.reduce((acc, s) => acc + s.profit, 0);
    const periodTotalTickets = filtered.length;
    const periodMargin = periodTotalSales > 0 ? (periodTotalProfit / periodTotalSales) * 100 : 0;

    type SellerRow = {
      userId: string;
      fullName: string;
      email: string;
      role: string;
      salesCount: number;
      totalSold: number;
      cost: number;
      profit: number;
    };

    type BranchBlock = {
      branchId: string;
      branchName: string;
      isMain: boolean;
      totalSales: number;
      totalCost: number;
      totalProfit: number;
      salesCount: number;
      sellers: Record<string, SellerRow>;
    };

    const branchMap: Record<string, BranchBlock> = {};

    // Inicializar con sucursales del negocio
    branches.forEach((b) => {
      branchMap[b.id] = {
        branchId: b.id,
        branchName: b.name,
        isMain: b.is_main,
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        salesCount: 0,
        sellers: {},
      };
    });

    const defaultBranch = branches.find((b) => b.is_main) || branches[0];
    const defaultBranchId = defaultBranch ? defaultBranch.id : 'principal';
    if (!branchMap[defaultBranchId]) {
      branchMap[defaultBranchId] = {
        branchId: defaultBranchId,
        branchName: defaultBranch ? defaultBranch.name : 'Sucursal Principal',
        isMain: true,
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        salesCount: 0,
        sellers: {},
      };
    }

    // Procesar cada venta
    filtered.forEach((sale) => {
      let bId = sale.branch_id;
      if (!bId || !branchMap[bId]) {
        bId = defaultBranchId;
      }
      const bBlock = branchMap[bId];
      if (!bBlock) return;

      bBlock.totalSales += sale.total;
      bBlock.totalCost += sale.cost;
      bBlock.totalProfit += sale.profit;
      bBlock.salesCount += 1;

      const uid = sale.user_id || 'mostrador';
      const sellerFound = sellers.find((s) => s.userId === uid);
      const name = sellerFound ? sellerFound.fullName : (uid === 'mostrador' ? 'Venta Directa en Caja' : 'Colaborador');
      const email = sellerFound ? sellerFound.email : '';
      const role = sellerFound ? sellerFound.role : 'cajero';

      if (!bBlock.sellers[uid]) {
        bBlock.sellers[uid] = {
          userId: uid,
          fullName: name,
          email,
          role,
          salesCount: 0,
          totalSold: 0,
          cost: 0,
          profit: 0,
        };
      }

      bBlock.sellers[uid].salesCount += 1;
      bBlock.sellers[uid].totalSold += sale.total;
      bBlock.sellers[uid].cost += sale.cost;
      bBlock.sellers[uid].profit += sale.profit;
    });

    const branchList = Object.values(branchMap).sort((a, b) => b.totalSales - a.totalSales);

    // Vendedor con mayor ganancia generada en el período
    const allSellersInPeriod: SellerRow[] = [];
    branchList.forEach((b) => {
      Object.values(b.sellers).forEach((s) => {
        allSellersInPeriod.push(s);
      });
    });
    allSellersInPeriod.sort((a, b) => b.profit - a.profit);
    const topSeller = allSellersInPeriod.length > 0 && allSellersInPeriod[0].profit > 0 ? allSellersInPeriod[0] : null;

    return {
      periodTotalSales,
      periodTotalCost,
      periodTotalProfit,
      periodTotalTickets,
      periodMargin,
      topSeller,
      branches: branchList,
    };
  }, [detailedSales, timeRange, dateFrom, dateTo, branches, sellers]);

  // Filtrado por buscador
  const filteredBranches = useMemo(() => {
    if (!search.trim()) return report.branches;
    const q = search.toLowerCase();
    return report.branches.filter((b) => {
      const matchBranch = b.branchName.toLowerCase().includes(q);
      const matchSeller = Object.values(b.sellers).some(
        (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
      return matchBranch || matchSeller;
    });
  }, [report.branches, search]);

  /* ─────────────────── Función de Impresión de Reporte ─────────────────── */
  const handlePrintReport = () => {
    const win = window.open('', '_blank', 'width=950,height=850');
    if (!win) return;

    const now = new Date();
    const emissionDate = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const emissionTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    let periodLabel = '';
    if (timeRange === 'today') {
      periodLabel = `Hoy (${emissionDate})`;
    } else if (timeRange === 'week') {
      periodLabel = 'Últimos 7 días';
    } else if (timeRange === 'month') {
      periodLabel = `Mes de ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    } else if (timeRange === 'all') {
      periodLabel = 'Histórico completo';
    } else if (timeRange === 'custom') {
      periodLabel = `Rango personalizado: ${dateFrom || 'Inicio'} hasta ${dateTo || 'Hoy'}`;
    }

    const currency = activeBusiness?.currency || 'BOB';
    const businessName = activeBusiness?.name || 'Mi Negocio';

    const branchListHtml = filteredBranches.map(b => {
      const sellersArr = Object.values(b.sellers);
      const branchMargin = b.totalSales > 0 ? ((b.totalProfit / b.totalSales) * 100).toFixed(1) : '0.0';

      const sellersRowsHtml = sellersArr.map(s => {
        const margin = s.totalSold > 0 ? ((s.profit / s.totalSold) * 100).toFixed(1) : '0.0';
        const share = b.totalSales > 0 ? ((s.totalSold / b.totalSales) * 100).toFixed(0) : '0';
        const roleText = s.role === 'owner' ? 'Propietario' : s.role === 'admin' ? 'Administrador' : 'Vendedor / Cajero';

        return `
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: 800; color: #0f172a;">${s.fullName}</div>
              <div style="font-size: 9px; color: #64748b;">${s.email || roleText}</div>
            </td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">
              ${s.salesCount}
            </td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">
              ${currency} ${s.totalSold.toFixed(2)}
            </td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; color: #64748b;">
              ${currency} ${s.cost.toFixed(2)}
            </td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 900; color: #059669;">
              + ${currency} ${s.profit.toFixed(2)}
            </td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 800; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
                ${margin}%
              </span>
            </td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 800; color: #475569;">
              ${share}%
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; page-break-inside: avoid;">
          <div style="background: #f8fafc; padding: 9px 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 12px; font-weight: 900; color: #0f172a;">🏢 ${b.branchName}</span>
              ${b.isMain ? '<span style="margin-left: 6px; padding: 2px 6px; font-size: 9px; font-weight: 900; background: #d1fae5; color: #065f46; border-radius: 4px;">PRINCIPAL</span>' : ''}
              <span style="font-size: 10px; color: #64748b; margin-left: 8px;">(${sellersArr.length} vendedor${sellersArr.length === 1 ? '' : 'es'})</span>
            </div>
            <div style="font-size: 10.5px; display: flex; gap: 12px;">
              <span>Facturado: <strong>${currency} ${b.totalSales.toFixed(2)}</strong></span>
              <span style="color: #059669;">Ganancia: <strong>${currency} ${b.totalProfit.toFixed(2)}</strong></span>
              <span style="color: #4f46e5;">Margen: <strong>${branchMargin}%</strong></span>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 900; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 7px 10px; text-align: left;">Vendedor</th>
                <th style="padding: 7px 10px; text-align: center;">Tickets</th>
                <th style="padding: 7px 10px; text-align: right;">Total Vendido</th>
                <th style="padding: 7px 10px; text-align: right;">Costo</th>
                <th style="padding: 7px 10px; text-align: right;">Ganancia Neta</th>
                <th style="padding: 7px 10px; text-align: center;">Margen</th>
                <th style="padding: 7px 10px; text-align: right;">Aporte</th>
              </tr>
            </thead>
            <tbody>
              ${sellersArr.length > 0 ? sellersRowsHtml : '<tr><td colspan="7" style="padding: 14px; text-align: center; color: #94a3b8;">Sin actividad registrada en esta sucursal.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte de Ventas y Vendedores - ${businessName}</title>
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
          .brand-header {
            background: ${activePrintColor.gradient};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: #ffffff;
            border-radius: 12px;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .cards-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
            background: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .footer {
            margin-top: 25px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 9.5px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="brand-header">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${activeBusiness?.logo_url ? `
              <img src="${activeBusiness.logo_url}" alt="Logo" style="width: 52px; height: 52px; object-fit: contain; border-radius: 10px; background: #ffffff; padding: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);" />
            ` : ''}
            <div>
              <div style="font-size: 18px; font-weight: 900; letter-spacing: -0.5px;">${businessName}</div>
              <div style="font-size: 11px; font-weight: 700; opacity: 0.95; margin-top: 2px;">REPORTE DE VENTAS, GANANCIAS Y SUCURSALES</div>
              <div style="font-size: 10px; opacity: 0.85; margin-top: 3px;">Período analizado: <strong>${periodLabel}</strong></div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 9px; opacity: 0.9; text-transform: uppercase;">Emisión</div>
            <div style="font-size: 11px; font-weight: 800;">${emissionDate}</div>
            <div style="font-size: 10px; opacity: 0.85;">${emissionTime}</div>
          </div>
        </div>

        <div class="cards-row">
          <div class="kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b;">TOTAL VENDIDO</div>
            <div style="font-size: 14px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 3px;">
              ${currency} ${report.periodTotalSales.toFixed(2)}
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${report.periodTotalTickets} tickets emitidos</div>
          </div>

          <div class="kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b;">GANANCIA NETA</div>
            <div style="font-size: 14px; font-weight: 900; font-family: monospace; color: #059669; margin-top: 3px;">
              ${currency} ${report.periodTotalProfit.toFixed(2)}
            </div>
            <div style="font-size: 9px; font-weight: 800; color: #059669; margin-top: 2px;">${report.periodMargin.toFixed(1)}% Margen</div>
          </div>

          <div class="kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b;">COSTO MERCADERÍA</div>
            <div style="font-size: 14px; font-weight: 900; font-family: monospace; color: #475569; margin-top: 3px;">
              ${currency} ${report.periodTotalCost.toFixed(2)}
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Costo de mercadería</div>
          </div>

          <div class="kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b;">VENDEDOR ESTRELLA</div>
            <div style="font-size: 11px; font-weight: 900; color: #7c3aed; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${report.topSeller ? report.topSeller.fullName : 'Sin datos'}
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
              ${report.topSeller ? '+ ' + currency + ' ' + report.topSeller.profit.toFixed(2) + ' ganancia' : 'Esperando ventas'}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 10px; font-size: 10.5px; font-weight: 900; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">
          Desglose por Sucursal y Rendimiento de Colaboradores
        </div>

        ${branchListHtml}

        <div class="footer">
          <div>
            <div><strong>KOMI POS Cloud</strong> · Plataforma Integral de Facturación e Inventario</div>
            <div style="font-size: 8.5px; color: #94a3b8; margin-top: 2px;">Documento de control interno no válido como factura tributaria</div>
          </div>
          <div style="text-align: center; width: 180px;">
            <div style="border-bottom: 1px solid #94a3b8; height: 30px; margin-bottom: 4px;"></div>
            <div style="font-weight: 700; font-size: 9.5px;">Firma / Aprobación</div>
          </div>
        </div>

        <script>
          window.addEventListener('load', () => {
            window.print();
          });
        </script>
      </body>
      </html>
    `);

    win.document.close();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* CABECERA PRINCIPAL CON BOTONES IMPRIMIR Y COLOR           */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('seller_report.title', 'Reporte de Ventas por Sucursal')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {t('seller_report.subtitle', 'Controla las ventas, ganancias netas y productividad de cada vendedor por sucursal')}
            </p>
          </div>
        </div>

        {/* Botones de Cabecera: Color Impresión e IMPRIMIR */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Selector de Color de Impresión */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-3.5 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Elegir color de la cabecera del reporte a imprimir"
            >
              <span
                className="w-4 h-4 rounded-full border-2 border-white shadow-xs flex-shrink-0"
                style={{ background: activePrintColor.gradient }}
              />
              <span className="hidden sm:inline">Color Impresión</span>
            </button>

            {/* Paleta desplegable de colores */}
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-zinc-700 p-4 w-72">
                <p className="text-xs font-black text-slate-700 dark:text-zinc-200 mb-3 uppercase tracking-wider">
                  🎨 Color de Encabezado para Impresión
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

          {/* Botón Imprimir */}
          <button
            type="button"
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="Imprimir reporte oficial de ventas y productividad"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
            <span>{t('common.print', 'IMPRIMIR')}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4 CARDS DE RESUMEN EJECUTIVO (DISEÑO COLOR GRADIENT)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. TOTAL VENDIDO (Rojo / Coral) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#ff416c] to-[#ff4b2b] text-white shadow-xl shadow-rose-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              {timeRange === 'today' ? 'Hoy' : timeRange === 'week' ? 'Semana' : timeRange === 'month' ? 'Mes' : timeRange === 'custom' ? 'Rango' : 'Todos'}
            </span>
          </div>
          {/* Watermark SVG decorativo de fondo */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <path d="M24 24H28L32 46H48L52 30H30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="34" cy="52" r="3" fill="white"/>
              <circle cx="46" cy="52" r="3" fill="white"/>
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
            {formatCurrency(report.periodTotalSales, activeBusiness?.currency || 'BOB')}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('seller_report.sold_today', 'TOTAL VENDIDO')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {report.periodTotalTickets} {t('seller_report.tickets_issued', 'tickets emitidos')}
          </p>
        </div>

        {/* 2. GANANCIA NETA (Verde Esmeralda) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#00b09b] to-[#96c93d] text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              {report.periodMargin.toFixed(1)}% Margen
            </span>
          </div>
          {/* Watermark SVG decorativo de fondo */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <polyline points="18,50 28,38 38,42 54,22" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <polyline points="44,22 54,22 54,32" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
            {formatCurrency(report.periodTotalProfit, activeBusiness?.currency || 'BOB')}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('seller_report.net_profit', 'GANANCIA NETA')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            Rendimiento neto generado
          </p>
        </div>

        {/* 3. COSTO MERCADERÍA (Azul Cian / Océano) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#4facfe] to-[#00f2fe] text-white shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Inversión
            </span>
          </div>
          {/* Watermark SVG decorativo de fondo */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <path d="M22 28L26 50H46L50 28H22Z" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M30 28V22C30 18.7 32.7 16 36 16C39.3 16 42 18.7 42 22V28" stroke="white" strokeWidth="3" fill="none"/>
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs truncate relative z-10 font-mono">
            {formatCurrency(report.periodTotalCost, activeBusiness?.currency || 'BOB')}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('seller_report.cost', 'COSTO MERCADERÍA')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10">
            {t('seller_report.cost_sub', 'Costo de productos vendidos')}
          </p>
        </div>

        {/* 4. VENDEDOR ESTRELLA (Púrpura / Índigo) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#8e2de2] to-[#4a00e0] text-white shadow-xl shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/15 text-white/90 px-2.5 py-0.5 rounded-full">
              Líder
            </span>
          </div>
          {/* Watermark SVG decorativo de fondo */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
            <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="white" fillOpacity="0.15"/>
              <circle cx="36" cy="30" r="10" stroke="white" strokeWidth="3" fill="none"/>
              <path d="M30 40L24 56L36 50L48 56L42 40" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <p className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-xs truncate relative z-10">
            {report.topSeller ? report.topSeller.fullName : t('employees.waiting', 'Esperando ventas')}
          </p>
          <p className="text-sm font-black uppercase tracking-wider text-white/95 mt-2 relative z-10">
            {t('employees.star_seller', 'VENDEDOR ESTRELLA')}
          </p>
          <p className="text-xs text-white/75 font-medium truncate mt-1 relative z-10 font-mono">
            {report.topSeller ? `+ ${formatCurrency(report.topSeller.profit, activeBusiness?.currency || 'BOB')} ganancia` : t('reports.no_data', 'Sin datos para el período')}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE BÚSQUEDA Y FILTROS DE PERÍODO / FECHA           */}
      {/* ======================================================== */}
      <Card className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 sm:p-2.5">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nombre de vendedor o sucursal..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Selector de Período con botones: Hoy, Semana, Mes, Todos, Fecha */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            {([
              { key: 'today',  label: 'Hoy' },
              { key: 'week',   label: 'Semana' },
              { key: 'month',  label: 'Mes' },
              { key: 'all',    label: 'Todos' },
              { key: 'custom', label: '📅 Fecha' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  timeRange === key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Fila desplegable: Rango personalizado Desde / Hasta */}
        {timeRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
            <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <label className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
              {t('sales.from', 'Desde')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            <span className="text-slate-300 dark:text-zinc-600 font-black">→</span>
            <label className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
              {t('sales.to', 'Hasta')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* DESGLOSE POR SUCURSAL Y TABLA DE VENDEDORES              */}
      {/* ======================================================== */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Calculando ventas y ganancias por sucursal...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
          <Store className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
            No se encontraron resultados
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Prueba cambiando el período de tiempo o el texto del buscador.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBranches.map((b) => {
            const sellerEntries = Object.values(b.sellers);
            const branchMargin = b.totalSales > 0 ? (b.totalProfit / b.totalSales) * 100 : 0;

            return (
              <Card
                key={b.branchId}
                className="overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs"
              >
                {/* Cabecera de Sucursal */}
                <div className="p-4 bg-slate-50/80 dark:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                          {b.branchName}
                        </h3>
                        {b.isMain && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {sellerEntries.length} vendedor{sellerEntries.length === 1 ? '' : 'es'} con actividad en este período
                      </p>
                    </div>
                  </div>

                  {/* Totales de la Sucursal */}
                  <div className="flex items-center gap-4 sm:gap-6 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black block">Facturado</span>
                      <span className="font-mono font-black text-slate-900 dark:text-zinc-100 text-sm">
                        Bs {b.totalSales.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black block">Ganancia</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        Bs {b.totalProfit.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black block">Margen</span>
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        {branchMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabla de Vendedores */}
                {sellerEntries.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Sin ventas registradas en esta sucursal para el período seleccionado.
                  </div>
                ) : (
                  <div className="w-full">
                    <table className="w-full text-left table-fixed text-xs">
                      <thead className="bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-zinc-800">
                        <tr>
                          <th className="py-2.5 px-3 w-[26%]">{t('seller_report.seller', 'Vendedor')}</th>
                          <th className="py-2.5 px-2 text-center w-[10%]">{t('common.tickets', 'Tickets')}</th>
                          <th className="py-2.5 px-2 text-right w-[17%]">{t('seller_report.sales', 'Total Vendido')}</th>
                          <th className="py-2.5 px-2 text-right w-[15%]">{t('seller_report.cost', 'Costo')}</th>
                          <th className="py-2.5 px-2 text-right w-[16%]">{t('seller_report.profit', 'Ganancia Neta')}</th>
                          <th className="py-2.5 px-2 text-center w-[8%]">{t('seller_report.margin_col', 'Margen %')}</th>
                          <th className="py-2.5 px-3 text-right w-[8%]">Aporte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold">
                        {sellerEntries.map((seller) => {
                          const sellerMargin = seller.totalSold > 0 ? (seller.profit / seller.totalSold) * 100 : 0;
                          const shareOfBranch = b.totalSales > 0 ? (seller.totalSold / b.totalSales) * 100 : 0;

                          return (
                            <tr key={seller.userId} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40">
                              {/* Vendedor */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-xs">
                                    {seller.fullName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-slate-900 dark:text-zinc-100 font-black text-xs truncate" title={seller.fullName}>
                                      {seller.fullName}
                                    </div>
                                    {seller.email && (
                                      <div className="text-[10px] text-slate-400 font-mono truncate" title={seller.email}>
                                        {seller.email}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Tickets */}
                              <td className="py-2.5 px-2 text-center font-mono text-slate-700 dark:text-zinc-300 text-xs">
                                {seller.salesCount}
                              </td>

                              {/* Facturado */}
                              <td className="py-2.5 px-2 text-right font-mono font-black text-slate-900 dark:text-zinc-100 text-xs truncate">
                                {formatCurrency(seller.totalSold, activeBusiness?.currency || 'BOB')}
                              </td>

                              {/* Costo */}
                              <td className="py-2.5 px-2 text-right font-mono text-slate-500 dark:text-zinc-400 text-xs truncate">
                                {formatCurrency(seller.cost, activeBusiness?.currency || 'BOB')}
                              </td>

                              {/* Ganancia */}
                              <td className="py-2.5 px-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs truncate">
                                + {formatCurrency(seller.profit, activeBusiness?.currency || 'BOB')}
                              </td>

                              {/* Margen */}
                              <td className="py-2.5 px-2 text-center">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {sellerMargin.toFixed(1)}%
                                </span>
                              </td>

                              {/* Aporte */}
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="w-12 bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full transition-all"
                                      style={{ width: `${Math.min(100, Math.max(0, shareOfBranch))}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-500 font-bold shrink-0">
                                    {shareOfBranch.toFixed(0)}%
                                  </span>
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
            );
          })}
        </div>
      )}
    </div>
  );
};
