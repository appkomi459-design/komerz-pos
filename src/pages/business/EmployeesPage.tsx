import React from 'react';
import { UserCheck } from 'lucide-react';
import { PreparedModuleView } from '@/components/common/PreparedModuleView';

export const EmployeesPage: React.FC = () => {
  return (
    <PreparedModuleView
      title="Personal y Colaboradores"
      description="Gestión de usuarios con acceso al sistema, asignación de roles y turnos de trabajo"
      icon={UserCheck}
      moduleCode="employees"
      features={[
        'Invitación a usuarios por correo electrónico',
        'Asignación de roles multi-tenant (Propietario, Admin, Gerente, Cajero)',
        'Restricción de acceso por sucursal específica',
        'Registro de auditoría por cada usuario operador',
      ]}
    />
  );
};
