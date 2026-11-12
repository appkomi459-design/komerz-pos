# Komi POS - Plataforma SaaS Punto de Venta Multiempresa

Plataforma profesional de Punto de Venta (POS) e inventario en modalidad SaaS multi-tenant construida con **React, TypeScript, Vite, Tailwind CSS y Supabase**.

---

## 🚀 Características Implementadas (Fase 1)

### 1. Arquitectura Multi-Tenant y Seguridad RLS
- **Aislamiento por Empresa:** Cada tabla contiene `business_id` y está protegida mediante **Row Level Security (RLS)** en PostgreSQL.
- **Funciones de Seguridad Definer:** 
  - `check_is_super_admin(uid)`
  - `user_belongs_to_business(b_id, uid)`
  - `user_has_business_role(b_id, uid, roles)`
  - `get_user_business_ids(uid)`
- **Protección contra Escalada de Privilegios:** Trigger de base de datos que impide que un usuario se autoasigne privilegios de `is_super_admin`.
- **Almacenamiento Aislado:** Bucket de Supabase Storage `business-assets` para logos y portadas de negocio.

### 2. Autenticación Real con Supabase Auth
- Registro con nombre, correo y contraseña.
- Inicio de sesión con persistencia y control de errores en español.
- Recuperación y restablecimiento de contraseña.
- Redirección automática:
  - Sin negocio registrado -> Asistente de Configuración Inicial (`/onboarding`).
  - Con negocio registrado -> Panel Privado del Negocio (`/app`).
  - Con rol Super Admin -> Acceso exclusivo a `/superadmin`.

### 3. Asistente de Configuración del Negocio (`/onboarding`)
- Nombre comercial y giro comercial (Retail, Minimarket, Ferretería, Ropa, Farmacia, etc.).
- País, ciudad, dirección y teléfono de contacto.
- Moneda principal y zona horaria.
- Subida de logotipo e imagen de portada directamente a Supabase Storage con previsualización en vivo.
- Creación automática de:
  - Registro de empresa (`businesses`).
  - Membresía como Propietario (`business_members` con rol `owner`).
  - Ajustes de facturación iniciales (`business_settings`).
  - Sucursal Principal (`branches`).
  - Suscripción inicial al plan de prueba (`subscriptions`).

### 4. Panel Privado del Negocio (`/app`)
- **Navegación completa con 16 módulos:**
  1. Dashboard
  2. Punto de venta
  3. Productos
  4. Categorías
  5. Inventario
  6. Ventas
  7. Clientes
  8. Proveedores
  9. Compras
  10. Caja
  11. Gastos
  12. Reportes
  13. Empleados
  14. Sucursales
  15. Configuración
  16. Suscripción
- **Dashboard Operativo en Vivo:**
  - Ventas del día (consultadas en tiempo real de Supabase).
  - Ventas acumuladas del mes.
  - Conteo exacto de transacciones.
  - Total de productos en catálogo.
  - Alerta de stock bajo (`stock <= min_stock`).
  - Lista de transacciones recientes y bitácora de auditoría.
- **Selector de Empresa:** Permite a usuarios que pertenecen a múltiples empresas cambiar de negocio activo con un clic sin cerrar sesión.
- **Punto de Venta Interactivo:** Selección rápida de artículos, búsqueda por código de barras, selección de método de pago, registro en tabla `sales` y descuento automático de stock en `products`.
- **Configuración Empresarial:** Ajuste de identidad corporativa, RNC/identificación fiscal, porcentaje de impuestos (ITBIS/IVA) y prefijo de factura.

### 5. Panel Exclusivo Super Admin (`/superadmin`)
- Protegido para cuentas con `is_super_admin = true`.
- Indicadores globales: Total de usuarios, Total de negocios, Negocios activos, Suspendidos, Suscripciones activas e Ingresos recurrentes (MRR).
- Directorio de tenants con capacidad de **Activar / Suspender** negocios directamente.
- Control de planes y tiers de suscripción.

---

## 🛠️ Variables de Entorno

Archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=https://yjydcmwizomogjxbudge.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💻 Comandos de Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción (Type check + Vite build)
npm run build
```
