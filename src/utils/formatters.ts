export function formatCurrency(amount: number, currency = 'USD'): string {
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    DOP: 'RD$',
    MXN: '$',
    COP: '$',
    PEN: 'S/.',
    CLP: '$',
    ARS: '$',
    BOB: 'Bs',
    Bs: 'Bs',
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
  { value: 'retail', label: 'Comercio General / Retail' },
  { value: 'minimarket', label: 'Minimarket / Colmado / Supermercado' },
  { value: 'hardware', label: 'Ferretería / Construcción' },
  { value: 'restaurant', label: 'Restaurante / Cafetería / Bar' },
  { value: 'pharmacy', label: 'Farmacia / Droguería' },
  { value: 'clothing', label: 'Tienda de Ropa y Calzado' },
  { value: 'stationery', label: 'Papelería / Librería' },
  { value: 'services', label: 'Servicios Profesionales' },
  { value: 'general', label: 'Otro Comercio' },
];

export const COUNTRIES = [
  { code: 'DO', name: 'República Dominicana', currency: 'DOP', timezone: 'America/Santo_Domingo' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', timezone: 'America/New_York' },
  { code: 'MX', name: 'México', currency: 'MXN', timezone: 'America/Mexico_City' },
  { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota' },
  { code: 'PE', name: 'Perú', currency: 'PEN', timezone: 'America/Lima' },
  { code: 'CL', name: 'Chile', currency: 'CLP', timezone: 'America/Santiago' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'ES', name: 'España', currency: 'EUR', timezone: 'Europe/Madrid' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', timezone: 'America/Guayaquil' },
  { code: 'PA', name: 'Panamá', currency: 'USD', timezone: 'America/Panama' },
  { code: 'GT', name: 'Guatemala', currency: 'GTQ', timezone: 'America/Guatemala' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', timezone: 'America/Costa_Rica' },
];
