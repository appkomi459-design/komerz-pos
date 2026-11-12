import React, { useState } from 'react';
import {
  ShoppingCart,
  Shirt,
  Wrench,
  Pill,
  Coffee,
  BookOpen,
  Briefcase,
  GitBranch,
  Sparkles,
  CheckCircle2,
  Tag,
  Calendar,
  Layers,
  Printer,
  Barcode,
  Search,
  CreditCard,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Building2,
  Store,
  ArrowRight,
  ShieldCheck,
  Package,
  TrendingUp,
  Croissant,
  IceCream,
  Beef,
} from 'lucide-react';

export interface BusinessTemplate {
  id: string;
  name: string;
  tagline: string;
  category: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  accentColor: string;
  terminalUrl: string;
  specialtyPills: string[];
  bannerImage: string;
  stockAlert: {
    message: string;
    criticalCount: number;
  };
  products: {
    id: string;
    name: string;
    price: number;
    cost: number;
    sku: string;
    stock: number;
    stockUnit: string;
    specialAttr: string;
    category: string;
    image: string;
    isLowStock?: boolean;
    stockWarningText?: string;
  }[];
  ticketInfo: {
    client: string;
    docType: string;
    specialNote: string;
    defaultDiscount?: number;
  };
  ticketFooter: string;
}

const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'ropa',
    name: 'Boutique Velvet & Denim',
    tagline: 'Tienda de Moda, Ropa y Calzado',
    category: 'Tiendas de Ropa y Calzado',
    icon: Shirt,
    badge: 'Tallas & Colores',
    badgeColor: 'border-violet-500/40 text-violet-300 bg-violet-950/60',
    accentColor: 'from-violet-500 to-fuchsia-500',
    terminalUrl: 'komerz-pos.cloud/boutique-velvet/caja-moda',
    bannerImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Matriz Tallas S-XXL', 'Paleta 6 Colores', 'Colección Temporada', 'Descuentos Flash'],
    stockAlert: {
      message: 'Hay 2 variantes de ropa y calzado que llegaron al límite mínimo de exhibición.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'r1',
        name: 'Camisa Casual Slim Fit L',
        price: 28.0,
        cost: 13.5,
        sku: 'MODA-SLIM-L',
        stock: 3,
        stockUnit: 'und',
        specialAttr: 'Tallas: S, M, L | Color: Azul Marino',
        category: 'Caballeros',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'STOCK CRÍTICO',
      },
      {
        id: 'r2',
        name: 'Zapatos Deportivos Pro 42',
        price: 65.0,
        cost: 32.0,
        sku: 'CALZ-PRO-42',
        stock: 2,
        stockUnit: 'pares',
        specialAttr: 'Tallas: 39 - 44 | Suela Eva Air',
        category: 'Calzado',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'ÚLTIMOS PARES',
      },
      {
        id: 'r3',
        name: 'Jeans Denim Stretch Clásico 32',
        price: 36.5,
        cost: 17.0,
        sku: 'DENIM-STR-32',
        stock: 24,
        stockUnit: 'und',
        specialAttr: 'Tallas: 28 a 34 | Denim 98% Algodón',
        category: 'Pantalones',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'r4',
        name: 'Chaqueta Urban Bomber M',
        price: 78.0,
        cost: 39.0,
        sku: 'BOMB-URB-M',
        stock: 12,
        stockUnit: 'und',
        specialAttr: 'Tallas: M, L, XL | Impermeable Térmica',
        category: 'Abrigos',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'r5',
        name: 'Vestido Estampado Verano S',
        price: 42.0,
        cost: 19.5,
        sku: 'VEST-VER-S',
        stock: 15,
        stockUnit: 'und',
        specialAttr: 'Tallas: XS, S, M | Tejido Seda Fría',
        category: 'Damas',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'r6',
        name: 'Gorra Urbana Snapback',
        price: 16.0,
        cost: 6.8,
        sku: 'ACC-GORR-01',
        stock: 40,
        stockUnit: 'und',
        specialAttr: 'Talla Única Ajustable | 4 Colores',
        category: 'Accesorios',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Camila Morales (Cliente VIP)',
      docType: 'Ticket / Factura Rápida',
      specialNote: '🏷️ Promo Temporada: -10% aplicado',
      defaultDiscount: 0.1,
    },
    ticketFooter: '¡Gracias por tu compra! Cambios válidos dentro de 15 días con etiqueta intacta.',
  },
  {
    id: 'minimarket',
    name: 'Supermercado & Express Don Juan',
    tagline: 'Viveres, Abarrotes y Alimentos',
    category: 'Minimarkets y Supermercados',
    icon: ShoppingCart,
    badge: 'Escáner + Ticket',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/60',
    accentColor: 'from-emerald-500 to-teal-500',
    terminalUrl: 'komerz-pos.cloud/express-donjuan/caja-rapida',
    bannerImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Lector de Barras USB/BT', 'Cobro en 3 Segundos', 'Caja Doble Turno', 'Pesaje en Balanza'],
    stockAlert: {
      message: 'Hay 2 productos de alta rotación que llegaron a su límite mínimo recomendado.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'm1',
        name: 'Café Puro Tostado 500g',
        price: 7.0,
        cost: 4.5,
        sku: 'PROD-3400',
        stock: 3,
        stockUnit: 'und',
        specialAttr: 'Código: 7861004512 | Tueste Medio',
        category: 'Bebidas',
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'STOCK CRÍTICO',
      },
      {
        id: 'm2',
        name: 'Aceite de Oliva Extra Virgen 1L',
        price: 8.5,
        cost: 5.2,
        sku: 'PROD-8742',
        stock: 4,
        stockUnit: 'bot',
        specialAttr: 'Código: 7861008742 | Prensado frío',
        category: 'Aceites',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'POR AGOTARSE',
      },
      {
        id: 'm3',
        name: 'Arroz Extra Seleccionado 10 lbs',
        price: 9.5,
        cost: 6.0,
        sku: 'PROD-1001',
        stock: 45,
        stockUnit: 'bol',
        specialAttr: 'Código: 7861002341 | Grano largo',
        category: 'Abarrotes',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'm4',
        name: 'Leche Entera Larga Vida UHT 1L',
        price: 1.95,
        cost: 1.25,
        sku: 'PROD-1198',
        stock: 85,
        stockUnit: 'und',
        specialAttr: 'Código: 7861001198 | Fortificada',
        category: 'Lácteos',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'm5',
        name: 'Jugo Natural Naranja Fresca 1L',
        price: 2.5,
        cost: 1.4,
        sku: 'PROD-3441',
        stock: 24,
        stockUnit: 'und',
        specialAttr: 'Código: 7861003441 | Sin conservantes',
        category: 'Bebidas',
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'm6',
        name: 'Galletas de Avena y Miel',
        price: 1.2,
        cost: 0.65,
        sku: 'PROD-9988',
        stock: 50,
        stockUnit: 'paq',
        specialAttr: 'Código: 7861009988 | Multipack 6 uds',
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Consumidor Final (Caja 01)',
      docType: 'Comprobante de Venta Rápida',
      specialNote: '⚡ Escaneado por código de barras de alta velocidad',
    },
    ticketFooter: '¡Gracias por su visita al Minimarket Don Juan! Atendemos de 7:00 a 22:00 todos los días.',
  },
  {
    id: 'ferreteria',
    name: 'Ferretería El Tornillo Industrial',
    tagline: 'Herramientas, Pinturas y Construcción',
    category: 'Ferreterías y Construcción',
    icon: Wrench,
    badge: 'Unidad & Kilos',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/60',
    accentColor: 'from-amber-500 to-orange-500',
    terminalUrl: 'komerz-pos.cloud/ferreteria-eltornillo/caja-mostrador',
    bannerImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Venta por Kilos/Metros', 'Precios Mayorista/Taller', 'Búsqueda por Referencia', 'Facturación con RUC'],
    stockAlert: {
      message: 'Hay 2 ítems de ferretería pesada con existencias bajas en mostrador.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'f1',
        name: 'Set Taladro Percutor 750W',
        price: 45.0,
        cost: 28.0,
        sku: 'FERR-750W',
        stock: 2,
        stockUnit: 'sets',
        specialAttr: 'Garantía 1 Año | Maletín 24 brocas',
        category: 'Herramientas',
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'STOCK CRÍTICO',
      },
      {
        id: 'f2',
        name: 'Pintura Látex Lavable Galón 3.8L',
        price: 18.0,
        cost: 11.2,
        sku: 'PINT-LAT-W',
        stock: 4,
        stockUnit: 'gal',
        specialAttr: 'Rendimiento: 35m² | Blanco Puro',
        category: 'Pinturas',
        image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'REORDENAR',
      },
      {
        id: 'f3',
        name: 'Clavos de Acero Concreto 2"',
        price: 3.2,
        cost: 1.8,
        sku: 'CLAV-AC-20',
        stock: 55,
        stockUnit: 'kg',
        specialAttr: 'Venta por Kilo o Saco | Ref: CL-20',
        category: 'Fijación',
        image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'f4',
        name: 'Juego Llaves Combinadas Cromo 12pzs',
        price: 24.5,
        cost: 14.0,
        sku: 'LLAV-CRV-12',
        stock: 15,
        stockUnit: 'sets',
        specialAttr: 'Medidas: 6mm a 22mm | Acero CR-V',
        category: 'Manuales',
        image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'f5',
        name: 'Disco de Corte Fino Metal 4.5"',
        price: 1.5,
        cost: 0.75,
        sku: 'DISC-COR-45',
        stock: 90,
        stockUnit: 'und',
        specialAttr: 'Grosor 1.2mm | Velocidad 13,300 RPM',
        category: 'Abrasivos',
        image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'f6',
        name: 'Cinta Métrica Profesional 8m',
        price: 6.8,
        cost: 3.5,
        sku: 'CINT-MET-8M',
        stock: 32,
        stockUnit: 'und',
        specialAttr: 'Carcasa antishock con freno de seguridad',
        category: 'Medición',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Constructora & Contratistas del Sur (RUC: 1792458901001)',
      docType: 'Factura Electrónica Oficial',
      specialNote: 'Despacho en mostrador | Almacén de obra',
    },
    ticketFooter: 'Mercadería revisada en mostrador. Garantía de herramientas directas con el importador.',
  },
  {
    id: 'farmacia',
    name: 'Farmacia & Droguería San Rafael',
    tagline: 'Medicamentos, Salud y Cuidado Personal',
    category: 'Farmacias y Droguerías',
    icon: Pill,
    badge: 'Lotes & Vencimiento',
    badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-950/60',
    accentColor: 'from-rose-500 to-pink-500',
    terminalUrl: 'komerz-pos.cloud/farmacia-sanrafael/caja-salud',
    bannerImage: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Control FEFO (Primero Vence)', 'Alerta de Lotes Caducos', 'Registro Médico', 'Venta con Receta'],
    stockAlert: {
      message: 'Hay 2 fármacos que llegaron a su lote crítico y requieren reposición sanitaria.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'fa1',
        name: 'Paracetamol 500mg (20 tabletas)',
        price: 3.5,
        cost: 1.4,
        sku: 'FAR-PAR-500',
        stock: 4,
        stockUnit: 'cajas',
        specialAttr: 'Lote: #B-2024-89 | Vence: 12/2027',
        category: 'Tabletas',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'LOTE CRÍTICO',
      },
      {
        id: 'fa2',
        name: 'Complejo B Forte (5 Inyectables)',
        price: 7.5,
        cost: 3.8,
        sku: 'INJ-COMP-B',
        stock: 3,
        stockUnit: 'cajas',
        specialAttr: 'Ampollas 2ml | Lote: #INJ-5501',
        category: 'Inyectables',
        image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'ÚLTIMOS LOTES',
      },
      {
        id: 'fa3',
        name: 'Crema Dérmica Cicatrizante 30g',
        price: 6.8,
        cost: 3.2,
        sku: 'CRM-DERM-30',
        stock: 18,
        stockUnit: 'tubos',
        specialAttr: 'Reg. Sanitario: ARCSA-2024 | Uso Tópico',
        category: 'Cremas',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'fa4',
        name: 'Protector Solar Facial FPS 50+ 100ml',
        price: 18.5,
        cost: 9.8,
        sku: 'PROT-SOL-50',
        stock: 12,
        stockUnit: 'frascos',
        specialAttr: 'Filtro UV/UVA | Dermatológicamente Testeado',
        category: 'Protectores',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'fa5',
        name: 'Amoxicilina + Clavulánico 875mg',
        price: 8.2,
        cost: 4.8,
        sku: 'FAR-AMX-875',
        stock: 5,
        stockUnit: 'cajas',
        specialAttr: 'Requiere Receta Médica | Lote: #AMX-91',
        category: 'Cápsulas',
        image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'RECETA OBLIGATORIA',
      },
      {
        id: 'fa6',
        name: 'Jarabe Pediátrico Antitusivo 120ml',
        price: 4.5,
        cost: 2.1,
        sku: 'JAR-ANT-120',
        stock: 25,
        stockUnit: 'frascos',
        specialAttr: 'Vía Oral con Gotero Dosificador',
        category: 'Jarabes',
        image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Dra. Patricia Valenzuela (C.I. 0918234561)',
      docType: 'Factura Farmacéutica con Lotes',
      specialNote: '📋 Trazabilidad regulatoria activa en cada línea',
    },
    ticketFooter: 'Medicamentos garantizados bajo cadena de frío y normativa sanitaria vigente. No se aceptan devoluciones.',
  },
  {
    id: 'restaurante',
    name: 'Bistro & Café Gourmet',
    tagline: 'Cafetería, Restaurante y Panadería Artesanal',
    category: 'Restaurantes y Cafeterías',
    icon: Coffee,
    badge: 'Mesas & Comandas',
    badgeColor: 'border-yellow-500/40 text-yellow-300 bg-yellow-950/60',
    accentColor: 'from-amber-500 to-yellow-500',
    terminalUrl: 'komerz-pos.cloud/bistro-gourmet/tpv-mesas',
    bannerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Mapa de Mesas Táctil', 'Comanda Directa a Cocina', 'Cálculo de Propina 10%', 'División de Cuentas'],
    stockAlert: {
      message: 'Hay 2 insumos de cocina y repostería que llegaron al stock mínimo de turno.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'res1',
        name: 'Hamburguesa Doble Smash + Papas',
        price: 8.5,
        cost: 3.6,
        sku: 'REST-HAMB-01',
        stock: 5,
        stockUnit: 'porc',
        specialAttr: 'Mesa #4 | Término 3/4, sin cebolla',
        category: 'Cocina Caliente',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'STOCK CRÍTICO',
      },
      {
        id: 'res2',
        name: 'Cheesecake Artesanal Frutos Rojos',
        price: 4.5,
        cost: 1.8,
        sku: 'POST-CHES-01',
        stock: 3,
        stockUnit: 'porc',
        specialAttr: 'Repostería | Coulis de arándanos y fresas',
        category: 'Postres',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'ÚLTIMAS PORC.',
      },
      {
        id: 'res3',
        name: 'Café Capuchino Vainilla Francesa',
        price: 3.5,
        cost: 0.95,
        sku: 'CAFE-CAP-VAN',
        stock: 80,
        stockUnit: 'tazas',
        specialAttr: 'Barra Café | Canela y leche descremada',
        category: 'Cafetería',
        image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'res4',
        name: 'Pizza Artesanal Cuatro Quesos',
        price: 14.0,
        cost: 5.5,
        sku: 'PIZZ-4Q-MED',
        stock: 30,
        stockUnit: 'pizzas',
        specialAttr: 'Horno Piedra | Masa madre 48h fermentada',
        category: 'Pizzas',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'res5',
        name: 'Jugo Natural Maracuyá 500ml',
        price: 2.5,
        cost: 0.8,
        sku: 'BEB-JUG-MAR',
        stock: 60,
        stockUnit: 'vasos',
        specialAttr: 'Bebidas Frías | Poco azúcar, con hielo',
        category: 'Bebidas',
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'res6',
        name: 'Ensalada César Pollo Grillé',
        price: 7.0,
        cost: 2.8,
        sku: 'COC-ENS-CES',
        stock: 25,
        stockUnit: 'platos',
        specialAttr: 'Cocina Fría | Aderezo en copa aparte',
        category: 'Entradas',
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Mesa #04 - Terraza (Mozo: Daniel)',
      docType: 'Pre-Cuenta de Consumo Gastronómico',
      specialNote: '🍽️ Comanda enviada a Cocina (Impresora Térmica 80mm)',
    },
    ticketFooter: 'Servicio no incluye propina voluntaria. ¡Esperamos que haya disfrutado su comida!',
  },
  {
    id: 'panaderia',
    name: 'Panadería & Pastelería La Espiga Dorada',
    tagline: 'Panes Artesanales, Croissants, Tortas y Bocaditos',
    category: 'Panaderías y Pastelerías',
    icon: Croissant,
    badge: 'Horneado & Docenas',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/60',
    accentColor: 'from-amber-500 to-orange-500',
    terminalUrl: 'komerz-pos.cloud/laespiga-dorada/caja-mostrador',
    bannerImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Horneado Caliente 3 Turnos', 'Venta por Unidad / Docena', 'Encargos de Tortas', 'Bocaditos al Peso'],
    stockAlert: {
      message: 'Hay 2 productos de horneado matutino que llegaron al límite mínimo de vitrina.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'pan1',
        name: 'Baguette Artesanal Masa Madre',
        price: 1.5,
        cost: 0.6,
        sku: 'PAN-BAG-01',
        stock: 8,
        stockUnit: 'und',
        specialAttr: 'Largo 55cm | Corteza crujiente masa madre',
        category: 'Panes',
        image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'HORNEAR MÁS',
      },
      {
        id: 'pan2',
        name: 'Croissant Francés Mantequilla',
        price: 1.8,
        cost: 0.75,
        sku: 'PAN-CROI-FR',
        stock: 5,
        stockUnit: 'und',
        specialAttr: '100% Mantequilla | Hojaldre artesanal',
        category: 'Hojaldres',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'ÚLTIMOS EN VITRINA',
      },
      {
        id: 'pan3',
        name: 'Pastel de Chocolate & Frutos Rojos',
        price: 18.0,
        cost: 8.5,
        sku: 'PST-CHOC-FR',
        stock: 6,
        stockUnit: 'tortas',
        specialAttr: 'Porciones: 12 personas | Relleno ganache',
        category: 'Pastelería',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'pan4',
        name: 'Pan de Molde Multicereales',
        price: 3.2,
        cost: 1.4,
        sku: 'PAN-MOLD-INT',
        stock: 20,
        stockUnit: 'und',
        specialAttr: 'Avena, linaza y chía | 650g rebanado',
        category: 'Saludables',
        image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'pan5',
        name: 'Empanadas de Carne al Horno',
        price: 1.25,
        cost: 0.55,
        sku: 'BOC-EMP-CRN',
        stock: 35,
        stockUnit: 'und',
        specialAttr: 'Venta por unidad o docena con descuento',
        category: 'Bocaditos',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'pan6',
        name: 'Donas Glaseadas Especiales x 6',
        price: 4.5,
        cost: 1.8,
        sku: 'DON-GLAS-06',
        stock: 15,
        stockUnit: 'cajas',
        specialAttr: 'Sabores: Fresa, Chocolate y Caramelo',
        category: 'Dulces',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Familia Ramírez (Cliente Frecuente)',
      docType: 'Comprobante de Panadería & Pastelería',
      specialNote: '🥖 Descuento por compra de docena aplicado',
    },
    ticketFooter: '¡Pan recién horneado todos los días desde las 6:00 AM! Haz tus pedidos de tortas con 24h de anticipación.',
  },
  {
    id: 'heladeria',
    name: 'Gelatería & Heladería Il Gelato',
    tagline: 'Helados Artesanales, Conos, Copas Sundae y Paletas',
    category: 'Heladerías y Gelaterías',
    icon: IceCream,
    badge: 'Sabores & Conos',
    badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/60',
    accentColor: 'from-cyan-500 to-pink-500',
    terminalUrl: 'komerz-pos.cloud/ilgelato-artesanal/caja-helados',
    bannerImage: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Selector de 24 Sabores', 'Conos, Vasos y Potes', 'Toppings y Salsas Extras', 'Envases Térmicos Delivery'],
    stockAlert: {
      message: 'Hay 2 cubetas de helado artesanal con menos del 20% de existencias.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'hld1',
        name: 'Cono Artesanal Doble Sabor Waffle',
        price: 3.5,
        cost: 1.1,
        sku: 'HLD-CON-WAF',
        stock: 6,
        stockUnit: 'und',
        specialAttr: 'Sabores: Pistacho & Frutilla Silvestre',
        category: 'Conos',
        image: 'https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'CUBETA BAJA',
      },
      {
        id: 'hld2',
        name: 'Copa Sundae Suprema con Toppings',
        price: 4.8,
        cost: 1.6,
        sku: 'HLD-SUN-SUP',
        stock: 4,
        stockUnit: 'und',
        specialAttr: '3 Bolas + Sirope Chocolate + Crema Chantilly',
        category: 'Copas',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'TOPPINGS LÍMITE',
      },
      {
        id: 'hld3',
        name: 'Tina Familiar 1 Litro (Para Llevar)',
        price: 9.5,
        cost: 3.8,
        sku: 'HLD-TIN-1LT',
        stock: 22,
        stockUnit: 'potes',
        specialAttr: 'Hasta 3 sabores a elección con envase térmico',
        category: 'Para Llevar',
        image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'hld4',
        name: 'Paleta Artesanal Rellena de Leche',
        price: 2.0,
        cost: 0.7,
        sku: 'HLD-PAL-GUR',
        stock: 35,
        stockUnit: 'und',
        specialAttr: 'Paleta fruta natural rellena de leche condensada',
        category: 'Paletas',
        image: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'hld5',
        name: 'Milkshake Batido Cremoso 500ml',
        price: 3.8,
        cost: 1.3,
        sku: 'HLD-MLK-500',
        stock: 40,
        stockUnit: 'vasos',
        specialAttr: 'A base de helado puro con salsa de caramelo',
        category: 'Batidos',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'hld6',
        name: 'Waffle Belga con Bola de Helado',
        price: 5.2,
        cost: 1.8,
        sku: 'HLD-WAF-BEL',
        stock: 18,
        stockUnit: 'platos',
        specialAttr: 'Waffle recién horneado + bola de vainilla',
        category: 'Postres',
        image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Mesa 2 / Para Llevar (Cajero: Mateo)',
      docType: 'Ticket Heladería Express',
      specialNote: '🍨 Incluye empaque térmico para mantener frío',
    },
    ticketFooter: '¡Gracias por endulzar tu día con Il Gelato! Consérvese congelado a -18°C.',
  },
  {
    id: 'carniceria',
    name: 'Carnicería & Cortes Selectos El Novillo',
    tagline: 'Cortes de Res, Cerdo, Pollo y Embutidos al Peso',
    category: 'Carnicerías y Frigoríficos',
    icon: Beef,
    badge: 'Balanza & Por Kilos',
    badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-950/60',
    accentColor: 'from-red-500 to-rose-600',
    terminalUrl: 'komerz-pos.cloud/elnovillo-carnes/caja-balanza',
    bannerImage: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
    specialtyPills: ['Conexión Balanza USB/RS232', 'Venta Fraccionada por Gramos', 'Control de Cámara Frigorífica', 'Trazabilidad de Faenamiento'],
    stockAlert: {
      message: 'Hay 2 cortes parrilleros premium que alcanzaron el stock mínimo en vitrina.',
      criticalCount: 2,
    },
    products: [
      {
        id: 'crn1',
        name: 'Bife de Chorizo / Ribeye Premium',
        price: 12.5,
        cost: 7.8,
        sku: 'CARN-BIF-RIB',
        stock: 4.5,
        stockUnit: 'kg',
        specialAttr: 'Corte parrillero madurado 21 días (por Kg)',
        category: 'Res Premium',
        image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'STOCK CRÍTICO',
      },
      {
        id: 'crn2',
        name: 'Costillas de Cerdo Especiales',
        price: 6.8,
        cost: 4.1,
        sku: 'CARN-CST-CRD',
        stock: 6.2,
        stockUnit: 'kg',
        specialAttr: 'Ideales para ahumar o asar a la brasa (por Kg)',
        category: 'Cerdo',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
        isLowStock: true,
        stockWarningText: 'ÚLTIMOS KILOS',
      },
      {
        id: 'crn3',
        name: 'Pechuga de Pollo Fresca Fileteada',
        price: 4.8,
        cost: 2.9,
        sku: 'CARN-POL-PEC',
        stock: 38.0,
        stockUnit: 'kg',
        specialAttr: 'Deshuesada y limpia sin piel (por Kg)',
        category: 'Aves',
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'crn4',
        name: 'Carne Molida Especial 90/10',
        price: 5.2,
        cost: 3.2,
        sku: 'CARN-MOL-ESP',
        stock: 25.0,
        stockUnit: 'kg',
        specialAttr: 'Molida fresca al instante de pulpa pura (por Kg)',
        category: 'Res',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'crn5',
        name: 'Chorizo Parrillero Artesanal x Kg',
        price: 7.5,
        cost: 4.2,
        sku: 'EMB-CHO-PAR',
        stock: 20.0,
        stockUnit: 'kg',
        specialAttr: 'Elaboración propia con hierbas y pimentón',
        category: 'Embutidos',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'crn6',
        name: 'Lomo Fino de Res Limpio (Tierno)',
        price: 15.0,
        cost: 9.5,
        sku: 'CARN-LOM-FIN',
        stock: 12.0,
        stockUnit: 'kg',
        specialAttr: 'Corte magro extra suave especial medallones (por Kg)',
        category: 'Res Premium',
        image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=400&q=80',
      },
    ],
    ticketInfo: {
      client: 'Sr. Gonzalo Peña - Parrilla Grill (RUC: 1718293041001)',
      docType: 'Factura Desglose Peso & Balanza',
      specialNote: '⚖️ Pesaje certificado por balanza electrónica digital',
    },
    ticketFooter: 'Carnes frescas certificadas bajo rigurosa cadena de frío (0°C a 4°C). Conserve refrigerado.',
  },
];

export const BusinessAdaptiveShowcase: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('ropa');
  const [viewMode, setViewMode] = useState<'pos' | 'stock' | 'ticket'>('pos');
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number; specialAttr: string }[]>([
    { id: 'r1', name: 'Camisa Casual Slim Fit L', price: 28.0, qty: 1, specialAttr: 'Talla L | Azul Marino' },
    { id: 'r2', name: 'Zapatos Deportivos Pro 42', price: 65.0, qty: 1, specialAttr: 'Talla 42 | Rojo' },
  ]);

  const activeTemplate = BUSINESS_TEMPLATES.find((t) => t.id === selectedId) || BUSINESS_TEMPLATES[0];

  // Cambiar de plantilla y reiniciar el carrito con productos de ese negocio
  const handleSelectBusiness = (b: BusinessTemplate) => {
    setSelectedId(b.id);
    if (b.products.length >= 2) {
      setCart([
        { id: b.products[0].id, name: b.products[0].name, price: b.products[0].price, qty: 1, specialAttr: b.products[0].specialAttr },
        { id: b.products[1].id, name: b.products[1].name, price: b.products[1].price, qty: 1, specialAttr: b.products[1].specialAttr },
      ]);
    } else {
      setCart([]);
    }
  };

  const addToCart = (prod: BusinessTemplate['products'][0]) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === prod.id);
      if (exists) {
        return prev.map((item) => (item.id === prod.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { id: prod.id, name: prod.name, price: prod.price, qty: 1, specialAttr: prod.specialAttr }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof cart
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountRate = activeTemplate.ticketInfo.defaultDiscount || 0;
  const discount = subtotal * discountRate;
  const tax = (subtotal - discount) * 0.12;
  const total = subtotal - discount + tax;

  const ActiveIcon = activeTemplate.icon;

  return (
    <div className="relative w-full">
      {/* SELECTOR DE NEGOCIOS: 8 TARJETAS VISUALES CON FOTOS REALES */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/30">
              1. Selecciona un Tipo de Comercio
            </span>
            <p className="text-sm text-slate-400 mt-1">
              Haz clic en cualquier negocio para ver cómo Komerz POS adapta su caja, inventario y tickets a su medida:
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Sistema 100% Adaptable en Vivo</span>
          </div>
        </div>

        {/* Grid de 8 negocios */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {BUSINESS_TEMPLATES.map((b) => {
            const isSelected = b.id === selectedId;
            const Icon = b.icon;
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBusiness(b)}
                className={`relative group rounded-2xl overflow-hidden p-2.5 text-left border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-slate-800/90 shadow-xl shadow-cyan-500/20 scale-[1.04] ring-2 ring-cyan-400/40'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850 hover:scale-[1.02]'
                }`}
              >
                {/* Mini foto de fondo */}
                <div className="relative w-full h-16 rounded-xl overflow-hidden mb-2 bg-slate-950">
                  <img
                    src={b.bannerImage}
                    alt={b.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-1.5 left-1.5">
                    <div
                      className={`w-7 h-7 rounded-lg bg-slate-900/90 flex items-center justify-center border ${
                        isSelected ? 'border-cyan-400 text-cyan-400 shadow-md' : 'border-slate-700 text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Título y badge */}
                <div>
                  <h4
                    className={`text-[12px] font-black leading-tight line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {b.category.split(' ')[0]} {b.category.split(' ')[1] || ''}
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-semibold block mt-0.5 truncate">{b.badge}</span>
                </div>

                {/* Indicador de activo */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 block shadow-[0_0_8px_#22d3ee]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VENTANA DEL SISTEMA ADAPTADO EN VIVO */}
      <div className="relative rounded-3xl bg-slate-950/95 border-2 border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* BARRA SUPERIOR DE VENTANA DEL NAVEGADOR / CLOUD OS */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Botones de ventana */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-sm" />
            </div>
            {/* URL simulación */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1 rounded-xl text-xs font-mono text-slate-300 shadow-inner">
              <span className="text-cyan-400 font-bold">https://</span>
              <span>{activeTemplate.terminalUrl}</span>
            </div>
          </div>

          {/* Selector de Vistas de la Adaptación (Caja POS / Control de Stock / Factura) */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('pos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pos'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>1. Punto de Venta (Caja)</span>
            </button>
            <button
              onClick={() => setViewMode('stock')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'stock'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>2. Control de Stock</span>
            </button>
            <button
              onClick={() => setViewMode('ticket')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'ticket'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>3. Impresión Adaptada</span>
            </button>
          </div>
        </div>

        {/* CABECERA DEL NEGOCIO ADAPTADO */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-cyan-500/40 p-2 shadow-xl flex items-center justify-center shrink-0">
              <ActiveIcon className="w-7 h-7 text-cyan-400 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{activeTemplate.name}</h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${activeTemplate.badgeColor}`}>
                  {activeTemplate.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{activeTemplate.tagline}</p>
            </div>
          </div>

          {/* Insignias de especialidad del comercio */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTemplate.specialtyPills.map((pill, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold px-3 py-1 rounded-xl bg-slate-900/80 text-slate-300 border border-slate-800 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                <span>{pill}</span>
              </span>
            ))}
          </div>
        </div>

        {/* CONTENIDO INTERACTIVO SEGÚN LA VISTA SELECCIONADA */}
        <div className="p-4 sm:p-6">
          {/* VISTA 1: PUNTO DE VENTA (CAJA POS) */}
          {viewMode === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LADO IZQUIERDO: CATÁLOGO DE PRODUCTOS ADAPTADO AL RUBRO */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="flex items-center justify-between gap-2 bg-slate-900/70 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>Catálogo de {activeTemplate.category} (Clic en un ítem para cobrar)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    6 Productos Listos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {activeTemplate.products.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className="group bg-slate-900/90 rounded-2xl p-3 border border-slate-800 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/15 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                    >
                      {/* Imagen del producto */}
                      <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2.5 bg-slate-950">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                        <span className="absolute top-2 left-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                          {prod.category}
                        </span>
                        <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                          Stock: {prod.stock} {prod.stockUnit}
                        </span>
                      </div>

                      {/* Información adaptada */}
                      <div>
                        <h5 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {prod.name}
                        </h5>
                        <p className="text-[11px] text-cyan-400 font-medium mt-1 bg-cyan-950/30 p-1.5 rounded-lg border border-cyan-500/20 line-clamp-1">
                          {prod.specialAttr}
                        </p>
                      </div>

                      {/* Precio y botón de agregar */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          ${prod.price.toFixed(2)}
                        </span>
                        <button className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LADO DERECHO: TICKET / RESUMEN DE COBRO EN VIVO */}
              <div className="lg:col-span-5 xl:col-span-4 bg-slate-900/95 rounded-2xl p-4 sm:p-5 border-2 border-cyan-500/30 shadow-2xl relative">
                {/* Cabecera del ticket */}
                <div className="border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                      TICKET #0042 • CAJA 1
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black">
                      EN VIVO
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-1">{activeTemplate.name}</h4>
                  <p className="text-[11px] text-slate-400">{activeTemplate.ticketInfo.client}</p>
                  <div className="mt-2 text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/30">
                    {activeTemplate.ticketInfo.specialNote}
                  </div>
                </div>

                {/* Lista de productos en el ticket */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      El ticket está vacío. Haz clic en cualquier producto para agregarlo.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-cyan-400 truncate">{item.specialAttr}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            ${item.price.toFixed(2)} c/u
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white font-mono px-1">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-5 h-5 rounded text-rose-400 hover:bg-rose-950/50 flex items-center justify-center ml-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totales y desglose */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuento Especial:</span>
                      <span className="font-mono">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>IVA / Impuestos (12%):</span>
                    <span className="font-mono text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                    <span>TOTAL A COBRAR:</span>
                    <span className="font-mono text-emerald-400 text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botón de cobro express */}
                <div className="mt-4 space-y-2">
                  <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cobrar Venta (F12)</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button
                      onClick={() => setViewMode('ticket')}
                      className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ver Impresión</span>
                    </button>
                    <button
                      onClick={() => setViewMode('stock')}
                      className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-violet-400" />
                      <span>Control de Stock</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: CONTROL DE STOCK ADAPTADO AL NEGOCIO */}
          {viewMode === 'stock' && (
            <div className="space-y-4 animate-fade-in text-left">
              {/* Banner de alerta de stock bajo */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-bounce shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-300">
                      ¡Alerta de Inventario en Tiempo Real! ({activeTemplate.name})
                    </p>
                    <p className="text-[11px] text-slate-300">{activeTemplate.stockAlert.message}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap self-start sm:self-center">
                  {activeTemplate.stockAlert.criticalCount} Alertas Activas
                </span>
              </div>

              {/* Tabla de inventario adaptada */}
              <div className="bg-slate-950/90 rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
                <table className="w-full text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-black text-[10px] uppercase bg-slate-900/50">
                      <th className="py-3.5 px-4 text-left">Producto</th>
                      <th className="py-3.5 px-4 text-center">SKU</th>
                      <th className="py-3.5 px-4 text-center">Costo</th>
                      <th className="py-3.5 px-4 text-center">Precio Venta</th>
                      <th className="py-3.5 px-4 text-center">Existencias</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
                    {activeTemplate.products.map((prod) => (
                      <tr
                        key={prod.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          prod.isLowStock ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl bg-slate-900 border overflow-hidden flex-shrink-0 ${
                              prod.isLowStock ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-slate-800'
                            }`}
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-black text-white text-xs leading-snug">{prod.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {prod.isLowStock ? (
                                <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  {prod.stockWarningText || 'STOCK CRÍTICO'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-cyan-400">{prod.category}</span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[220px]">
                                {prod.specialAttr}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400 text-xs">
                          {prod.sku}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-400 text-xs">
                          ${prod.cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-emerald-400 text-xs font-mono">
                          ${prod.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {prod.isLowStock ? (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black text-[11px] animate-pulse inline-flex items-center gap-1">
                              {prod.stock} {prod.stockUnit.toUpperCase()} ⚠️
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-bold text-[11px]">
                              {prod.stock} {prod.stockUnit.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                            ACTIVO
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Barra de métricas de inventario adaptado */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Productos</span>
                    <span className="font-black text-white font-mono">{activeTemplate.products.length} ítems en catálogo</span>
                  </div>
                  <div className="border-l border-slate-800 pl-4 sm:pl-6">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Valoración de Stock</span>
                    <span className="font-black text-emerald-400 font-mono">
                      ${activeTemplate.products.reduce((acc, p) => acc + p.cost * p.stock, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-l border-slate-800 pl-4 sm:pl-6">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Control Particular</span>
                    <span className="font-black text-cyan-400">{activeTemplate.badge}</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewMode('pos')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black text-xs hover:scale-105 transition-transform cursor-pointer shadow-md"
                >
                  Ir al Punto de Venta (Caja)
                </button>
              </div>
            </div>
          )}

          {/* VISTA 3: FORMATO DE TICKET / IMPRESIÓN ADAPTADO */}
          {viewMode === 'ticket' && (
            <div className="max-w-lg mx-auto bg-white text-slate-950 rounded-2xl p-6 sm:p-8 shadow-2xl font-mono text-xs border border-slate-300">
              {/* Encabezado del Ticket Térmico */}
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">{activeTemplate.name}</h3>
                <p className="text-[11px] text-slate-600">{activeTemplate.tagline}</p>
                <p className="text-[10px] text-slate-500 mt-1">RUC: 1792485901001 • Tel: +593 98 765 4321</p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-black uppercase">
                  {activeTemplate.ticketInfo.docType}
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="text-[11px] space-y-1 mb-4 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">FECHA:</span>
                  <span>12/11/2026 - 19:45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">CLIENTE:</span>
                  <span className="font-bold text-right truncate max-w-[200px]">{activeTemplate.ticketInfo.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">ESPECIALIDAD:</span>
                  <span className="font-bold text-indigo-700">{activeTemplate.badge}</span>
                </div>
              </div>

              {/* Detalle de Productos */}
              <div className="space-y-2 mb-4 border-b-2 border-dashed border-slate-300 pb-3">
                <div className="flex justify-between font-black text-slate-800 border-b border-slate-200 pb-1">
                  <span>DESCRIPCIÓN</span>
                  <span>TOTAL</span>
                </div>
                {cart.map((item) => (
                  <div key={item.id} className="text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>{item.qty}x {item.name}</span>
                      <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pl-4">{item.specialAttr}</div>
                  </div>
                ))}
              </div>

              {/* Resumen Financiero */}
              <div className="space-y-1.5 text-[11px] mb-4">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>DESCUENTO:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IVA 12%:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t-2 border-slate-900 pt-2">
                  <span>TOTAL PAGADO:</span>
                  <span className="text-base">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Pie del Ticket con QR */}
              <div className="text-center pt-3 border-t-2 border-dashed border-slate-300">
                <p className="text-[10px] text-slate-600 mb-2 leading-relaxed">{activeTemplate.ticketFooter}</p>
                <div className="w-20 h-20 bg-slate-900 rounded-lg mx-auto flex items-center justify-center text-white text-[10px] font-black">
                  [ QR OFICIAL ]
                </div>
                <p className="text-[9px] text-slate-500 mt-2 font-mono">Consulte su garantía y catálogo digital escaneando este QR</p>
              </div>

              {/* Botón de regreso */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setViewMode('pos')}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Regresar a Vista Caja
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
