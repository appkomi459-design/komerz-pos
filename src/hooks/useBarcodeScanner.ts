/**
 * useBarcodeScanner
 * -----------------
 * Hook para detectar lectores de código de barras USB/Bluetooth (pistola).
 * Las pistolas envían caracteres muy rápido (<50ms entre teclas) y terminan
 * con Enter.  El hook acumula el buffer y dispara onScan() cuando recibe Enter
 * con al menos 3 caracteres.
 *
 * También soporta entrada manual: si el usuario tipea lento, el buffer se
 * descarta y se reinicia con el próximo carácter (no se dispara onScan).
 *
 * @param onScan   callback llamado con el código escaneado
 * @param active   cuando false, el listener se desactiva (ej: cuando hay un
 *                 modal de formulario abierto para no interferir)
 */

import { useEffect, useRef } from 'react';

const SCAN_THRESHOLD_MS = 60; // tiempo máximo entre teclas de pistola
const MIN_BARCODE_LENGTH = 3;  // mínimo de caracteres para considerarlo escaneo

export function useBarcodeScanner(
  onScan: (code: string) => void,
  active: boolean = true
) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  // Mantener referencia actualizada al callback sin re-registrar el listener
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input/textarea/select (evitar interferencia)
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code.length >= MIN_BARCODE_LENGTH) {
          onScanRef.current(code);
        }
        bufferRef.current = '';
        lastKeyTimeRef.current = 0;
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff < SCAN_THRESHOLD_MS || bufferRef.current.length === 0) {
          bufferRef.current += e.key;
        } else {
          // Escritura lenta del usuario → reiniciar buffer
          bufferRef.current = e.key;
        }
        lastKeyTimeRef.current = now;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      bufferRef.current = '';
    };
  }, [active]);
}
