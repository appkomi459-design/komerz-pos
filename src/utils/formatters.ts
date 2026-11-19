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
    GBP: '£',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',
    RON: 'lei',
    TRY: '₺',
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
  defaultLanguage?: 'es' | 'en' | 'pt' | 'fr' | 'it' | 'de';
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'BO', name: 'Bolivia', currency: 'BOB', timezone: 'America/La_Paz', flag: '🇧🇴', defaultLanguage: 'es' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', timezone: 'America/Sao_Paulo', flag: '🇧🇷', defaultLanguage: 'pt' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG', timezone: 'America/Asuncion', flag: '🇵🇾', defaultLanguage: 'es' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', timezone: 'America/Montevideo', flag: '🇺🇾', defaultLanguage: 'es' },
  { code: 'PE', name: 'Perú', currency: 'PEN', timezone: 'America/Lima', flag: '🇵🇪', defaultLanguage: 'es' },
  { code: 'EC', name: 'Ecuador (Dolarizado)', currency: 'USD', timezone: 'America/Guayaquil', flag: '🇪🇨', isDollarized: true, defaultLanguage: 'es' },
  { code: 'PA', name: 'Panamá (Dolarizado)', currency: 'USD', timezone: 'America/Panama', flag: '🇵🇦', isDollarized: true, defaultLanguage: 'es' },
  { code: 'SV', name: 'El Salvador (Dolarizado)', currency: 'USD', timezone: 'America/El_Salvador', flag: '🇸🇻', isDollarized: true, defaultLanguage: 'es' },
  { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota', flag: '🇨🇴', defaultLanguage: 'es' },
  { code: 'MX', name: 'México', currency: 'MXN', timezone: 'America/Mexico_City', flag: '🇲🇽', defaultLanguage: 'es' },
  { code: 'CL', name: 'Chile', currency: 'CLP', timezone: 'America/Santiago', flag: '🇨🇱', defaultLanguage: 'es' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷', defaultLanguage: 'es' },
  { code: 'DO', name: 'República Dominicana', currency: 'DOP', timezone: 'America/Santo_Domingo', flag: '🇩🇴', defaultLanguage: 'es' },
  { code: 'GT', name: 'Guatemala', currency: 'GTQ', timezone: 'America/Guatemala', flag: '🇬🇹', defaultLanguage: 'es' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC', timezone: 'America/Costa_Rica', flag: '🇨🇷', defaultLanguage: 'es' },
  { code: 'HN', name: 'Honduras', currency: 'HNL', timezone: 'America/Tegucigalpa', flag: '🇭🇳', defaultLanguage: 'es' },
  { code: 'NI', name: 'Nicaragua', currency: 'NIO', timezone: 'America/Managua', flag: '🇳🇮', defaultLanguage: 'es' },
  { code: 'US', name: 'Estados Unidos (Dólar)', currency: 'USD', timezone: 'America/New_York', flag: '🇺🇸', isDollarized: true, defaultLanguage: 'en' },
  { code: 'ES', name: 'España', currency: 'EUR', timezone: 'Europe/Madrid', flag: '🇪🇸', defaultLanguage: 'es' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', timezone: 'Europe/Lisbon', flag: '🇵🇹', defaultLanguage: 'pt' },
  { code: 'FR', name: 'Francia', currency: 'EUR', timezone: 'Europe/Paris', flag: '🇫🇷', defaultLanguage: 'fr' },
  { code: 'IT', name: 'Italia', currency: 'EUR', timezone: 'Europe/Rome', flag: '🇮🇹', defaultLanguage: 'it' },
  { code: 'DE', name: 'Alemania', currency: 'EUR', timezone: 'Europe/Berlin', flag: '🇩🇪', defaultLanguage: 'de' },
  { code: 'GB', name: 'Reino Unido', currency: 'GBP', timezone: 'Europe/London', flag: '🇬🇧', defaultLanguage: 'en' },
  { code: 'CH', name: 'Suiza', currency: 'CHF', timezone: 'Europe/Zurich', flag: '🇨🇭', defaultLanguage: 'de' },
  { code: 'NL', name: 'Países Bajos', currency: 'EUR', timezone: 'Europe/Amsterdam', flag: '🇳🇱', defaultLanguage: 'en' },
  { code: 'BE', name: 'Bélgica', currency: 'EUR', timezone: 'Europe/Brussels', flag: '🇧🇪', defaultLanguage: 'fr' },
  { code: 'IE', name: 'Irlanda', currency: 'EUR', timezone: 'Europe/Dublin', flag: '🇮🇪', defaultLanguage: 'en' },
  { code: 'AT', name: 'Austria', currency: 'EUR', timezone: 'Europe/Vienna', flag: '🇦🇹', defaultLanguage: 'de' },
  { code: 'SE', name: 'Suecia', currency: 'SEK', timezone: 'Europe/Stockholm', flag: '🇸🇪', defaultLanguage: 'en' },
  { code: 'NO', name: 'Noruega', currency: 'NOK', timezone: 'Europe/Oslo', flag: '🇳🇴', defaultLanguage: 'en' },
  { code: 'DK', name: 'Dinamarca', currency: 'DKK', timezone: 'Europe/Copenhagen', flag: '🇩🇰', defaultLanguage: 'en' },
  { code: 'PL', name: 'Polonia', currency: 'PLN', timezone: 'Europe/Warsaw', flag: '🇵🇱', defaultLanguage: 'en' },
  { code: 'CZ', name: 'República Checa', currency: 'CZK', timezone: 'Europe/Prague', flag: '🇨🇿', defaultLanguage: 'en' },
];
