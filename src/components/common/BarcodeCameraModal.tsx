/**
 * BarcodeCameraModal
 * ------------------
 * Modal que abre la cámara del dispositivo (ideal para móvil) y escanea
 * códigos de barras / QR usando @zxing/browser.
 *
 * API compatible con @zxing/browser 0.1.x – 0.4.x:
 * - Usa BrowserMultiFormatReader (extiende BrowserCodeReader)
 * - Para detener: cancela el stream de la MediaStream directamente
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { X, Camera, RefreshCw, AlertTriangle } from 'lucide-react';

interface BarcodeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

export const BarcodeCameraModal: React.FC<BarcodeCameraModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código de Barras',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const hasScanned = useRef(false);

  const stopScanner = useCallback(() => {
    try { controlsRef.current?.stop(); } catch (_) {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (_) {}
    controlsRef.current = null;
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    hasScanned.current = false;
    setError(null);
    setScanning(false);

    try {
      // Listar cámaras disponibles
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(devices);

      // Preferir cámara trasera en móvil
      let deviceId = selectedCamera;
      if (!deviceId) {
        const back = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment')
        );
        deviceId = back?.deviceId ?? devices[0]?.deviceId;
        setSelectedCamera(deviceId);
      }

      const reader = new BrowserMultiFormatReader();

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result && !hasScanned.current) {
            hasScanned.current = true;
            const code = result.getText();
            stopScanner();
            onScan(code);
            onClose();
          }
          if (err && !(err instanceof NotFoundException)) {
            // NotFoundException es normal (frame sin código) → ignorar
          }
        }
      );

      controlsRef.current = controls;
      // Capturar el stream del video para poder detenerlo
      if (videoRef.current?.srcObject instanceof MediaStream) {
        streamRef.current = videoRef.current.srcObject;
      }
      setScanning(true);
    } catch (e: any) {
      setScanning(false);
      if (e?.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Habilitá el acceso a la cámara en tu navegador.');
      } else if (e?.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setError(`Error al iniciar la cámara: ${e?.message || 'desconocido'}`);
      }
    }
  }, [selectedCamera, stopScanner, onScan, onClose]);

  // Iniciar al abrir, detener al cerrar
  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwitchCamera = () => {
    stopScanner();
    if (cameras.length > 1) {
      const idx = cameras.findIndex((c) => c.deviceId === selectedCamera);
      const next = cameras[(idx + 1) % cameras.length];
      setSelectedCamera(next.deviceId);
      setTimeout(() => startScanner(), 400);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-zinc-100">{title}</span>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Visor de cámara */}
        <div className="relative bg-black" style={{ aspectRatio: '1 / 1' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Mira de escaneo */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-emerald-400/70 animate-pulse" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-black/70 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
              <p className="text-white text-sm font-bold leading-snug">{error}</p>
            </div>
          )}

          {/* Spinner de carga */}
          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {scanning
              ? '📷 Apuntá al código de barras'
              : error
              ? 'Verificá el permiso de cámara'
              : 'Iniciando cámara...'}
          </p>
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                title="Cambiar cámara"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Cambiar</span>
              </button>
            )}
            {error && (
              <button
                onClick={startScanner}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
