import React, { useState, useEffect } from 'react';
import { Receipt, Search, Download, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Sale } from '@/types';

export const SalesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeBusiness) return;
    const fetchSales = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('sales')
          .select('*, customer:customers(*)')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false });
        if (data) setSales(data as Sale[]);
      } catch (err) {
        console.error('Error fetching sales:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [activeBusiness]);

  const filteredSales = sales.filter(
    (s) =>
      s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer && s.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Historial de Ventas
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Registro de todas las facturas y comprobantes emitidos en el negocio
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Buscar por número de factura o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            Cargando historial de ventas...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-zinc-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No hay ventas registradas.</p>
            <p className="text-xs mt-1">Realiza tu primera venta desde el Punto de Venta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-800/60 uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800 font-bold">
                <tr>
                  <th className="px-6 py-3.5">Nº Factura</th>
                  <th className="px-6 py-3.5">Fecha & Hora</th>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Método de Pago</th>
                  <th className="px-6 py-3.5">Subtotal</th>
                  <th className="px-6 py-3.5">Impuesto</th>
                  <th className="px-6 py-3.5">Total</th>
                  <th className="px-6 py-3.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-zinc-100">
                      {sale.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(sale.created_at)}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-zinc-300">
                      {sale.customer?.name || 'Cliente de paso'}
                    </td>
                    <td className="px-6 py-4 uppercase font-semibold text-gray-600 dark:text-zinc-400">
                      {sale.payment_method}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatCurrency(sale.subtotal, activeBusiness?.currency)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatCurrency(sale.tax, activeBusiness?.currency)}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(sale.total, activeBusiness?.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="emerald" size="sm">
                        {sale.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
