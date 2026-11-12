import React from 'react';
import { Boxes } from 'lucide-react';
import { PreparedModuleView } from '@/components/common/PreparedModuleView';

export const InventoryPage: React.FC = () => {
  return (
    <PreparedModuleView
      title="Inventario y Stock"
      description="Monitoreo de movimientos, transferencias entre sucursales y ajustes de inventario"
      icon={Boxes}
      moduleCode="inventory"
      features={[
        'Kardex de entradas y salidas por producto',
        'Transferencias directas entre sucursales',
        'Toma física de inventario y ajustes por mermas',
        'Alertas tempranas de reorden automáticas',
        'Cálculo de costo promedio ponderado',
      ]}
    />
  );
};
