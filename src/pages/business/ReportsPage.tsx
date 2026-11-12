import React from 'react';
import { BarChart3 } from 'lucide-react';
import { PreparedModuleView } from '@/components/common/PreparedModuleView';

export const ReportsPage: React.FC = () => {
  return (
    <PreparedModuleView
      title="Reportes y Analíticas"
      description="Estadísticas de rendimiento, artículos más vendidos y estado financiero del negocio"
      icon={BarChart3}
      moduleCode="reports"
      features={[
        'Ranking de productos más vendidos y márgenes brutos',
        'Ventas por horario pico, cajero y método de pago',
        'Estado de resultados consolidado por período',
        'Exportación de datos en Excel, CSV y reportes ejecutivos PDF',
      ]}
    />
  );
};
