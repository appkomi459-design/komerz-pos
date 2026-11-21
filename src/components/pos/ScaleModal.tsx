import React, { useState } from 'react';
import { Scale, X, Check, Delete } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (weightKg: number) => void;
  productName?: string;
  pricePerKg?: number;
  currency?: string;
}

export const ScaleModal: React.FC<ScaleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  pricePerKg = 0,
  currency = 'Bs',
}) => {
  const [weightStr, setWeightStr] = useState('0.500');

  const handleDigit = (d: string) => {
    if (d === '.' && weightStr.includes('.')) return;
    if (weightStr === '0' && d !== '.') {
      setWeightStr(d);
      return;
    }
    setWeightStr((prev) => (prev.length < 7 ? prev + d : prev));
  };

  const handleBackspace = () => {
    setWeightStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleQuickWeight = (val: number) => {
    setWeightStr(val.toFixed(3));
  };

  const currentWeight = parseFloat(weightStr) || 0;
  const totalPrice = currentWeight * pricePerKg;

  const handleConfirm = () => {
    if (currentWeight <= 0) return;
    onConfirm(currentWeight);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚖️ Balanza de Pesaje Electrónica">
      <div className="p-5 space-y-4 text-slate-800 dark:text-zinc-100">
        {productName && (
          <div className="text-center border-b border-slate-100 dark:border-zinc-800 pb-2">
            <h4 className="font-black text-sm text-slate-900 dark:text-zinc-100 truncate">
              {productName}
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Precio: {currency} {pricePerKg.toFixed(2)} / Kg
            </p>
          </div>
        )}

        {/* Pantalla Digital de la Balanza */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-center shadow-inner border border-slate-700 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            PESO REGISTRADO
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-wider">
            {weightStr} <span className="text-sm text-slate-300">KG</span>
          </div>
          {pricePerKg > 0 && (
            <div className="text-xs font-bold text-slate-300 pt-1 border-t border-slate-800">
              Total Calculado: <span className="text-emerald-400 font-black">{currency} {totalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Atajos Rápidos */}
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {[
            { label: '¼ kg', val: 0.25 },
            { label: '½ kg', val: 0.5 },
            { label: '¾ kg', val: 0.75 },
            { label: '1.0 kg', val: 1.0 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleQuickWeight(item.val)}
              className="py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 font-black text-slate-700 dark:text-zinc-200 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={() => handleDigit(btn)}
              className="py-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 font-mono text-base font-black text-slate-800 dark:text-zinc-100 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {btn}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 font-black flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Borrar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botón Confirmar */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1" size="md">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={currentWeight <= 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-black"
            size="md"
            icon={<Check className="w-4 h-4" />}
          >
            Confirmar Peso
          </Button>
        </div>
      </div>
    </Modal>
  );
};
