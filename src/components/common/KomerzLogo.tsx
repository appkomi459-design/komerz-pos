import React from 'react';
import { ShopIllustration } from './ShopIllustration';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

export const KomerzLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle = 'Cloud SaaS',
}) => {
  const sizeMap = {
    sm: { icon: 'w-9 h-8', text: 'text-base', sub: 'text-[8px]', box: 'w-9 h-8' },
    md: { icon: 'w-13 h-11', text: 'text-xl', sub: 'text-[9px]', box: 'w-13 h-11' },
    lg: { icon: 'w-16 h-13', text: 'text-2xl', sub: 'text-[10px]', box: 'w-16 h-13' },
    xl: { icon: 'w-20 h-16', text: 'text-3xl', sub: 'text-xs', box: 'w-20 h-16' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* LOGO TIENDITA KOMERZ POS */}
      <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
        <ShopIllustration className={`${currentSize.box} drop-shadow-[0_3px_6px_rgba(16,185,129,0.25)]`} />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${currentSize.text} font-black tracking-tight text-slate-900 dark:text-white`}>
              Komerz
            </span>
            <span className={`${currentSize.text} font-black tracking-tight text-emerald-600 dark:text-emerald-400 drop-shadow-sm`}>
              POS
            </span>
          </div>
          {subtitle && (
            <span
              className={`${currentSize.sub} font-bold uppercase tracking-[0.2em] text-emerald-600/90 dark:text-emerald-400/80 mt-0.5`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
