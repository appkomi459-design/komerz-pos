import React from 'react';
import { TrendingDown } from 'lucide-react';
import { PreparedModuleView } from '@/components/common/PreparedModuleView';

export const ExpensesPage: React.FC = () => {
  return (
    <PreparedModuleView
      title="Gastos Operativos"
      description="Registro de egresos, pagos de servicios, nómina y mantenimiento del local"
      icon={TrendingDown}
      moduleCode="expenses"
      features={[
        'Categorización de gastos (Servicios, Nómina, Renta, etc.)',
        'Asociación a sucursal y comprobante fiscal',
        'Impacto directo en el arqueo de caja o cuenta bancaria',
        'Análisis de rentabilidad neta real',
      ]}
    />
  );
};
