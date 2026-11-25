/**
 * BarcodeCameraModal
 * ------------------
 * Modal híbrido de escaneo ultrarrápido para Android, iOS y Desktop:
 * 1. Android / Chrome: Usa la API nativa BarcodeDetector (aceleración por hardware, ~20ms).
 * 2. iOS Safari / Fallback: Usa @zxing/browser optimizado solo a formatos comerciales + HD + TRY_HARDER.
 * 3. Emite un beep corto + vibración háptica al detectar el código.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { X, Camera, RefreshCw, AlertTriangle } from 'lucide-react';

interface BarcodeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

const RETAIL_NATIVE_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'itf',
  'qr_code',
];

const RETAIL_ZXING_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
];

function playScanFeedback() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(70);
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1320, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
    setTimeout(() => ctx.close().catch(() => {}), 200);
  } catch (_) {}
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
  const timerRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const hasScanned = useRef(false);

  const stopScanner = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try { controlsRef.current?.stop(); } catch (_) {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (_) {}
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch (_) {}
    }
    controlsRef.current = null;
    streamRef.current = null;
    setScanning(false);
  }, []);

  const handleSuccess = useCallback(
    (code: string) => {
      if (hasScanned.current) return;
      hasScanned.current = true;
      playScanFeedback();
      stopScanner();
      onScan(code);
      onClose();
    },
    [stopScanner, onScan, onClose]
  );

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    hasScanned.current = false;
    setError(null);
    setScanning(false);

    try {
      // 1. Abrir cámara HD con preferencia trasera y enfoque continuo
      const videoConstraints: MediaTrackConstraints = selectedCamera
        ? {
            deviceId: { exact: selectedCamera },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      streamRef.current = stream;

      // Intentar activar autofocus continuo si el dispositivo lo soporta (Android)
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.applyConstraints === 'function') {
        try {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          });
        } catch (_) {}
      }

      // Listar cámaras disponibles para el botón "Cambiar"
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        setCameras(devices);
        if (!selectedCamera && track) {
          const settings = track.getSettings();
          if (settings.deviceId) setSelectedCamera(settings.deviceId);
        }
      } catch (_) {}

      const videoEl = videoRef.current;
      videoEl.srcObject = stream;
      await videoEl.play();
      setScanning(true);

      // 2. Intentar motor nativo BarcodeDetector (Android Chrome / Edge)
      const NativeBarcodeDetector = (window as unknown as {
        BarcodeDetector?: {
          new (opts?: { formats?: string[] }): {
            detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
          };
          getSupportedFormats?: () => Promise<string[]>;
        };
      }).BarcodeDetector;

      if (NativeBarcodeDetector) {
        try {
          let formatsToUse = RETAIL_NATIVE_FORMATS;
          if (typeof NativeBarcodeDetector.getSupportedFormats === 'function') {
            const supported = await NativeBarcodeDetector.getSupportedFormats();
            const filtered = RETAIL_NATIVE_FORMATS.filter((f) => supported.includes(f));
            if (filtered.length > 0) formatsToUse = filtered;
          }
          const detector = new NativeBarcodeDetector({ formats: formatsToUse });

          const detectLoop = async () => {
            if (hasScanned.current || !videoRef.current || !streamRef.current) return;
            try {
              if (videoRef.current.readyState >= 2) {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleSuccess(barcodes[0].rawValue);
                  return;
                }
              }
            } catch (_) {}
            timerRef.current = window.setTimeout(detectLoop, 60);
          };

          detectLoop();
          return;
        } catch (_) {
          // Si falla la inicialización nativa, continúa con ZXing
        }
      }

      // 3. Fallback optimizado con ZXing (iOS Safari / Firefox / Desktop)
      const hints = new Map<DecodeHintType, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, RETAIL_ZXING_FORMATS);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);
      const controls = await reader.decodeFromStream(stream, videoEl, (result, err) => {
        if (result && !hasScanned.current) {
          handleSuccess(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          // Frame sin código → ignorar
        }
      });

      controlsRef.current = controls;
    } catch (e: unknown) {
      setScanning(false);
      const errObj = e as { name?: string; message?: string };
      if (errObj?.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Habilitá el acceso a la cámara en tu navegador.');
      } else if (errObj?.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setError(`Error al iniciar la cámara: ${errObj?.message || 'desconocido'}`);
      }
    }
  }, [selectedCamera, handleSuccess]);

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
      setTimeout(() => startScanner(), 300);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.stopPropagation()}
    >
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
    </div>,
    document.body
  );
};
