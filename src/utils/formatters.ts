export function formatCurrency(amount: number, currency = 'USD'): string {
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    BOB: 'Bs',
    Bs: 'Bs',
    BRL: 'R$',
    PYG: '₲',
    UYU: '$U',
    DOP: 'RD$',
    MXN: '$',
    COP: '$',
    PEN: 'S/.',
    CLP: '$',
    ARS: '$',
    GTQ: 'Q',
    CRC: '₡',
    HNL: 'L',
    NIO: 'C$',
  };

  const symbol = symbolMap[currency] || currency;

  const formattedNumber = new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  return `${symbol} ${formattedNumber}`;
}

export function formatFullDate(date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export const BUSINESS_TYPES = [
  { value: 'clothing', label: 'Tienda de Ropa y Calzado (Tallas, Colores, Género)' },
  { value: 'minimarket', label: 'Minimarket / Supermercado (Código de Barras, Pack)' },
  { value: 'hardware', label: 'Ferretería / Construcción (Unidades, Metros, Kilos)' },
  { value: 'pharmacy', label: 'Farmacia / Droguería (Lotes, Vencimiento, Fórmulas)' },
  { value: 'restaurant', label: 'Restaurante / Cafetería (Comandas, Mesas, Delivery)' },
  { value: 'bakery', label: 'Panadería / Pastelería (Horneadas, Peso, Porciones)' },
  { value: 'icecream', label: 'Heladería / Gelatería (Sabores, Conos, Vasos, Kilos)' },
  { value: 'butchery', label: 'Carnicería / Frigorífico (Cortes, Pesaje balanza, Kg/Lb)' },
  { value: 'retail', label: 'Comercio General / Retail' },
  { value: 'general', label: 'Otro Giro Comercial' },
];

export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  flag: string;
  isDollarized?: boolean;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'BO', name: 'Bolivia', currency: 'BOB', timezone: 'America/La_Paz', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG', timezone: 'America/Asuncion', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', timezone: 'America/Montevideo', flag: '🇺🇾' },
  { code: 'PE', name: 'Perú', currency: 'PEN', timezone: 'America/Lima', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador (Dolarizado)', currency: 'USD', timezone: 'America/Guayaquil', flag: '🇪🇨', isDollarized: true },
  { code: 'PA', name: 'Panamá (Dolarizado)', currency: 'USD', timezone: 'America/Panama', flag: '🇵🇦', isDollarized: true },
  { code: 'SV', name: 'El Salvador (Dolarizado)', currency: 'USD', timezone: 'America/El_Salvador', flag: '🇸🇻', isDollarized: true },
  { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota', flag: '🇨🇴' },
  { code: 'MX', name: 'México', currency: 'MXN', timezone: 'America/Mexico_City', flag: '🇲🇽' },
  { code: 'CL', name: 'Chile', currency: 'CLP', timezone: 'America/Santiago', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { code: 'DO', name: 'República Dominicana', currency: 'DOP', timezone: 'America/Santo_Domingo', flag: '🇩🇴' },
  { code: 'GT', name: 'Guatemala', currency: 'GTQ', timezone: 'America/Guatemala', flag: '🇬🇹' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', timezone: 'America/Costa_Rica', flag: '🇨🇷' },
  { code: 'HN', name: 'Honduras', currency: 'HNL', timezone: 'America/Tegucigalpa', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', currency: 'NIO', timezone: 'America/Managua', flag: '🇳🇮' },
  { code: 'US', name: 'Estados Unidos (Dólar)', currency: 'USD', timezone: 'America/New_York', flag: '🇺🇸', isDollarized: true },
  { code: 'ES', name: 'España', currency: 'EUR', timezone: 'Europe/Madrid', flag: '🇪🇸' },
];
