import React from 'react';
import { Truck } from 'lucide-react';
import { PreparedModuleView } from '@/components/common/PreparedModuleView';

export const SuppliersPage: React.FC = () => {
  return (
    <PreparedModuleView
      title="Proveedores"
      description="Directorio de abastecedores, condiciones comerciales y cuentas por pagar"
      icon={Truck}
      moduleCode="suppliers"
      features={[
        'Registro de proveedores comerciales y fiscales',
        'Historial de compras y órdenes emitidas',
        'Control de plazos de pago (crédito y contado)',
        'Catálogo de productos asociados por proveedor',
      ]}
    />
  );
};
