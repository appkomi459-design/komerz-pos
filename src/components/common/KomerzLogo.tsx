import React from 'react';

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
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[8px]', box: 'w-7 h-7 rounded-lg' },
    md: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-[9px]', box: 'w-10 h-10 rounded-xl' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-[10px]', box: 'w-12 h-12 rounded-2xl' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-xs', box: 'w-16 h-16 rounded-3xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* SÍMBOLO ISOMÉTRICO "K" - ESMERALDA NÓRDICO & TEAL PROFESIONAL */}
      <div
        className={`${currentSize.box} relative flex items-center justify-center p-2 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-950/40 group-hover:shadow-emerald-500/30 group-hover:scale-105 transition-all duration-300 ring-1 ring-emerald-400/30`}
      >
        <div className="absolute inset-0 bg-white/10 rounded-[inherit] backdrop-blur-[1px]" />
        
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        >
          {/* Barra vertical K */}
          <path
            d="M7 6C7 4.89543 7.89543 4 9 4H10.5C11.6046 4 12.5 4.89543 12.5 6V26C12.5 27.1046 11.6046 28 10.5 28H9C7.89543 28 7 27.1046 7 26V6Z"
            fill="white"
          />
          {/* Brazo diagonal superior (Menta Glacial) */}
          <path
            d="M13.5 16.5L22.5 7.5C23.3 6.7 24.7 7.2 24.7 8.4V11.2C24.7 12 24.3 12.8 23.6 13.4L17.5 18.5L13.5 16.5Z"
            fill="#d1fae5"
          />
          {/* Brazo diagonal inferior (Esmeralda Brillante) */}
          <path
            d="M16 17.2L23.8 24.8C24.5 25.4 24.9 26.2 24.9 27.1V27.5C24.9 28.5 23.6 29 22.9 28.3L13.5 19L16 17.2Z"
            fill="#a7f3d0"
          />
          {/* Destello de luz */}
          <circle cx="15" cy="17.5" r="2" fill="#34d399" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${currentSize.text} font-black tracking-tight text-white`}>
              Komerz
            </span>
            <span className={`${currentSize.text} font-black tracking-tight text-emerald-400 drop-shadow-sm`}>
              POS
            </span>
          </div>
          {subtitle && (
            <span
              className={`${currentSize.sub} font-bold uppercase tracking-[0.2em] text-emerald-400/80 mt-0.5`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
