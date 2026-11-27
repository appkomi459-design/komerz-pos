/**
 * usePlatform – detecta si la app corre dentro de un TWA (Trusted Web Activity)
 * de Android / Play Store, o en un navegador web normal.
 *
 * Métodos de detección:
 *  1. document.referrer contiene "android-app://"  (señal oficial TWA)
 *  2. display-mode: standalone en Android        (TWA / PWA Android)
 *  3. Query param ?source=android                (útil para pruebas manuales)
 */
export function usePlatform() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { isTWA: false, isWeb: true };
  }

  const referrerIsTWA = document.referrer.includes('android-app://');
  const isAndroidUA = /Android/i.test(navigator.userAgent || '');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const hasAndroidParam =
    new URLSearchParams(window.location.search).get('source') === 'android';

  const isTWA = referrerIsTWA || (isStandalone && isAndroidUA) || hasAndroidParam;

  return { isTWA, isWeb: !isTWA };
}
