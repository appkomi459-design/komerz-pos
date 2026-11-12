import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { PreparedModuleView } from '@/components/common/PreparedModuleView';

export const PurchasesPage: React.FC = () => {
  return (
    <PreparedModuleView
      title="Compras y Órdenes"
      description="Registro de recepciones de mercadería y facturas de compras para reposición de stock"
      icon={ShoppingBag}
      moduleCode="purchases"
      features={[
        'Creación y validación de órdenes de compra',
        'Ingreso automático de stock al recepcionar factura',
        'Actualización automática de precios de costo',
        'Control de pagos a proveedores',
      ]}
    />
  );
};
