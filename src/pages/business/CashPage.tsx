import React from 'react';
import { Wallet } from 'lucide-react';
import { PreparedModuleView } from '@/components/common/PreparedModuleView';

export const CashPage: React.FC = () => {
  return (
    <PreparedModuleView
      title="Caja y Turnos"
      description="Control de aperturas, cierres de caja y arqueo diario por cajero"
      icon={Wallet}
      moduleCode="cash"
      features={[
        'Apertura de turno con fondo inicial de cambio',
        'Registro de entradas y salidas menores de efectivo',
        'Cierre de turno ciego y detección de sobrantes/faltantes',
        'Impresión de reporte Z y resumen de caja',
      ]}
    />
  );
};
