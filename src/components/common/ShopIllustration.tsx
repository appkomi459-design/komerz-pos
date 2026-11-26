import React from 'react';

interface ShopIllustrationProps {
  className?: string;
}

/**
 * Ilustración vectorial flat estilo "Tiendita" adaptada a la paleta Komerz POS
 * (esmeralda, teal, ámbar y pizarra).
 */
export const ShopIllustration: React.FC<ShopIllustrationProps> = ({ className = 'w-44 h-36' }) => {
  return (
    <svg
      viewBox="0 0 240 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Fondo orgánico suave */}
      <path
        d="M36 146C18 124 22 86 44 64C64 44 86 30 120 30C156 30 186 46 202 72C218 98 214 132 196 150C178 168 54 168 36 146Z"
        className="fill-emerald-200/60 dark:fill-emerald-950/50"
      />
      {/* Destellos decorativos */}
      <circle cx="34" cy="54" r="4" className="fill-emerald-400/70" />
      <circle cx="208" cy="48" r="3" className="fill-amber-400/80" />

      {/* Plantitas izquierda */}
      <rect x="24" y="148" width="18" height="16" rx="3" fill="#CBD5E1" />
      <rect x="22" y="146" width="22" height="4" rx="2" fill="#94A3B8" />
      <path d="M26 146C26 135 30 127 33 127C36 127 40 135 40 146H26Z" fill="#10B981" />
      <path d="M33 146C33 135 36 129 38 129C39.5 129 41 136 41 146H33Z" fill="#059669" />

      {/* Plantitas derecha */}
      <rect x="198" y="148" width="18" height="16" rx="3" fill="#CBD5E1" />
      <rect x="196" y="146" width="22" height="4" rx="2" fill="#94A3B8" />
      <path d="M200 146C200 135 204 127 207 127C210 127 214 135 214 146H200Z" fill="#10B981" />
      <path d="M207 146C207 135 210 129 212 129C213.5 129 215 136 215 146H207Z" fill="#059669" />

      {/* Letrero superior "KOMERZ" */}
      <rect x="86" y="34" width="4" height="12" fill="#334155" />
      <rect x="118" y="34" width="4" height="12" fill="#334155" />
      <rect x="150" y="34" width="4" height="12" fill="#334155" />
      <rect x="74" y="42" width="92" height="5" rx="2.5" fill="#1E293B" />
      <rect x="64" y="10" width="112" height="28" rx="14" fill="#F59E0B" />
      <rect x="68" y="14" width="104" height="20" rx="10" fill="#FEF3C7" />
      <text
        x="120"
        y="28"
        textAnchor="middle"
        fill="#0F172A"
        fontSize="12"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="2.2"
      >
        KOMERZ
      </text>

      {/* Fachada principal de la tiendita */}
      <rect x="46" y="82" width="148" height="82" rx="4" fill="#FDE68A" />
      {/* Sombra bajo el toldo */}
      <rect x="46" y="82" width="148" height="6" fill="#F59E0B" fillOpacity="0.45" />
      {/* Detalles de ladrillitos suaves */}
      <rect x="52" y="96" width="10" height="5" rx="1" fill="#F59E0B" fillOpacity="0.35" />
      <rect x="176" y="104" width="12" height="5" rx="1" fill="#F59E0B" fillOpacity="0.35" />
      <rect x="106" y="148" width="12" height="5" rx="1" fill="#F59E0B" fillOpacity="0.35" />

      {/* Letrero lateral "POS" */}
      <rect x="194" y="104" width="6" height="3" fill="#334155" />
      <rect x="194" y="128" width="6" height="3" fill="#334155" />
      <rect x="198" y="96" width="18" height="42" rx="4" fill="#10B981" />
      <text
        x="207"
        y="111"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="8"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        P
      </text>
      <text
        x="207"
        y="121"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="8"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        O
      </text>
      <text
        x="207"
        y="131"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="8"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        S
      </text>

      {/* Puerta izquierda */}
      <rect x="58" y="98" width="38" height="66" rx="2" fill="#1E293B" />
      <rect x="61" y="101" width="32" height="32" rx="1" fill="#7DD3FC" />
      <rect x="61" y="136" width="32" height="26" rx="1" fill="#7DD3FC" />
      {/* Reflejo vidrio puerta */}
      <path d="M64 133L85 101H91L70 133H64Z" fill="#BAE6FD" fillOpacity="0.7" />
      {/* Manija */}
      <rect x="85" y="139" width="6" height="2.5" rx="1.2" fill="#E2E8F0" />
      {/* Cartelito OPEN en la puerta */}
      <line x1="77" y1="106" x2="68" y2="113" stroke="#1E293B" strokeWidth="1.2" />
      <line x1="77" y1="106" x2="86" y2="113" stroke="#1E293B" strokeWidth="1.2" />
      <circle cx="77" cy="106" r="1.8" fill="#FFFFFF" />
      <rect x="66" y="112" width="22" height="11" rx="2" fill="#10B981" />
      <text
        x="77"
        y="120"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="5.5"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        OPEN
      </text>

      {/* Ventana grande derecha */}
      <rect x="108" y="98" width="74" height="50" rx="3" fill="#1E293B" />
      <rect x="112" y="102" width="66" height="42" rx="1.5" fill="#7DD3FC" />
      {/* Reflejos diagonales ventana */}
      <path d="M122 144L154 102H165L133 144H122Z" fill="#BAE6FD" fillOpacity="0.65" />
      <path d="M142 144L174 102H178V109L150 144H142Z" fill="#BAE6FD" fillOpacity="0.45" />
      {/* Repisa blanca ventana */}
      <rect x="106" y="148" width="78" height="4" rx="1.5" fill="#F8FAFC" />

      {/* Toldo superior a rayas (Esmeralda y Crema) */}
      <path d="M52 46H188L202 74H38L52 46Z" fill="#ECFDF5" />
      {/* Franjas inclinadas esmeralda */}
      <path d="M52 46H74L64 74H38L52 46Z" fill="#10B981" />
      <path d="M96 46H118L114 74H90L96 46Z" fill="#10B981" />
      <path d="M140 46H162L166 74H142L140 46Z" fill="#10B981" />
      <path d="M184 46H188L202 74H190L184 46Z" fill="#10B981" />

      {/* Borde frontal del toldo */}
      <rect x="38" y="74" width="26" height="10" rx="3" fill="#059669" />
      <rect x="64" y="74" width="26" height="10" rx="3" fill="#D1FAE5" />
      <rect x="90" y="74" width="24" height="10" rx="3" fill="#059669" />
      <rect x="114" y="74" width="28" height="10" rx="3" fill="#D1FAE5" />
      <rect x="142" y="74" width="24" height="10" rx="3" fill="#059669" />
      <rect x="166" y="74" width="24" height="10" rx="3" fill="#D1FAE5" />
      <rect x="190" y="74" width="12" height="10" rx="3" fill="#059669" />

      {/* Base / vereda */}
      <rect x="18" y="164" width="204" height="8" rx="4" fill="#1E293B" />
    </svg>
  );
};
