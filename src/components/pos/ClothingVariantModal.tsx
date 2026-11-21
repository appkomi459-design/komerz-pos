import React, { useState } from 'react';
import { Shirt, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ClothingVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (variant: { size: string; color: string }) => void;
  productName?: string;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44'];
const COLORS = [
  { name: 'Negro', bg: '#18181b', text: '#ffffff' },
  { name: 'Blanco', bg: '#f4f4f5', text: '#18181b', border: true },
  { name: 'Azul', bg: '#2563eb', text: '#ffffff' },
  { name: 'Rojo', bg: '#dc2626', text: '#ffffff' },
  { name: 'Beige', bg: '#e4d5b7', text: '#18181b' },
  { name: 'Gris', bg: '#71717a', text: '#ffffff' },
  { name: 'Verde', bg: '#16a34a', text: '#ffffff' },
  { name: 'Rosado', bg: '#f472b6', text: '#ffffff' },
];

export const ClothingVariantModal: React.FC<ClothingVariantModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
}) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Negro');

  const handleConfirm = () => {
    onConfirm({ size: selectedSize, color: selectedColor });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👗 Seleccionar Talla y Color">
      <div className="p-5 space-y-4 text-slate-800 dark:text-zinc-100">
        {productName && (
          <div className="text-center border-b border-slate-100 dark:border-zinc-800 pb-2">
            <h4 className="font-black text-sm text-slate-900 dark:text-zinc-100 truncate">
              {productName}
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Elige la variante de la prenda para descontar del stock
            </p>
          </div>
        )}

        {/* Selector de Talla */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
            1. Talla:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedSize === sz
                    ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-400'
                    : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Color */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
            2. Color:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {COLORS.map((col) => (
              <button
                key={col.name}
                type="button"
                onClick={() => setSelectedColor(col.name)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedColor === col.name
                    ? 'ring-2 ring-purple-500 font-black'
                    : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: col.bg,
                  color: col.text,
                  border: col.border ? '1px solid #d4d4d8' : 'none',
                }}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        {/* Botón Confirmar */}
        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <Button variant="outline" onClick={onClose} className="flex-1" size="md">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black"
            size="md"
            icon={<Check className="w-4 h-4" />}
          >
            Agregar al Carrito
          </Button>
        </div>
      </div>
    </Modal>
  );
};
