import React from 'react';

// ====================================================================
// 1. ILUSTRACIÓN: USUARIOS / CUENTAS (Red de Avatares Holográficos)
// ====================================================================
export const UsersIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center select-none pointer-events-none ${className}`}>
    {/* Anillo de pulso de fondo */}
    <div className="absolute inset-0 rounded-full bg-white/10 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
    <div className="absolute w-16 h-16 rounded-full bg-blue-400/20 blur-md animate-pulse" />

    {/* SVG Ilustración 3D de Usuarios / Comunidad */}
    <svg viewBox="0 0 120 120" className="w-full h-full animate-card-float drop-shadow-xl" fill="none">
      {/* Círculo base con brillo */}
      <circle cx="60" cy="60" r="48" fill="url(#userBgGrad)" fillOpacity="0.25" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

      {/* Ondas orbitales */}
      <ellipse cx="60" cy="72" rx="38" ry="14" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Avatar Izquierdo */}
      <g className="animate-card-float-delayed" opacity="0.85">
        <circle cx="38" cy="48" r="11" fill="url(#avatarGrad1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <path d="M23 72 C23 60 53 60 53 72" fill="url(#avatarBody1)" />
      </g>

      {/* Avatar Derecho */}
      <g className="animate-card-float-delayed" opacity="0.85">
        <circle cx="82" cy="48" r="11" fill="url(#avatarGrad2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <path d="M67 72 C67 60 97 60 97 72" fill="url(#avatarBody2)" />
      </g>

      {/* Avatar Central Principal (Más Grande con relieve) */}
      <g>
        {/* Glow detrás */}
        <circle cx="60" cy="42" r="16" fill="rgba(255,255,255,0.3)" filter="blur(4px)" />
        <circle cx="60" cy="42" r="15" fill="url(#avatarMain)" stroke="#ffffff" strokeWidth="2" />
        {/* Sonrisa / Cara abstracta */}
        <path d="M42 80 C42 64 78 64 78 80" fill="url(#avatarMainBody)" stroke="#ffffff" strokeWidth="1.5" />
      </g>

      {/* Insignia / Badge Flotante "Verificado" */}
      <g className="animate-star-twinkle">
        <circle cx="74" cy="30" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
        <path d="M71 30 L73.5 32.5 L77 28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Partículas de brillo flotantes */}
      <circle cx="28" cy="32" r="2" fill="#ffffff" className="animate-star-twinkle" />
      <circle cx="94" cy="36" r="2.5" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1s' }} />
      <circle cx="88" cy="78" r="2" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1.5s' }} />

      <defs>
        <radialGradient id="userBgGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) scale(48)">
          <stop stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="avatarMain" x1="45" y1="27" x2="75" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
        <linearGradient id="avatarMainBody" x1="42" y1="64" x2="78" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="avatarGrad1" x1="27" y1="37" x2="49" y2="59" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0e7ff" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="avatarBody1" x1="23" y1="60" x2="53" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c7d2fe" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="avatarGrad2" x1="71" y1="37" x2="93" y2="59" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bae6fd" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="avatarBody2" x1="67" y1="60" x2="97" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// ====================================================================
// 2. ILUSTRACIÓN: USUARIOS EN PRUEBA (Cohete Despegando + Estrellas)
// ====================================================================
export const RocketTrialIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center select-none pointer-events-none ${className}`}>
    <div className="absolute w-16 h-16 rounded-full bg-amber-400/25 blur-lg animate-pulse" />

    {/* SVG Cohete Despegando con Fuego y Estrellas */}
    <svg viewBox="0 0 120 120" className="w-full h-full animate-card-float drop-shadow-2xl" fill="none">
      {/* Estela de propulsión / Humo */}
      <g opacity="0.65">
        <circle cx="34" cy="94" r="9" fill="rgba(255,255,255,0.4)" className="animate-star-twinkle" />
        <circle cx="44" cy="88" r="11" fill="rgba(255,255,255,0.5)" />
        <circle cx="28" cy="84" r="7" fill="rgba(255,255,255,0.3)" />
      </g>

      {/* Fuego del Cohete */}
      <g>
        {/* Llama exterior naranja */}
        <path d="M42 78 Q36 94 40 102 Q48 96 52 86 Z" fill="url(#fireOuter)" className="animate-pulse" />
        {/* Llama interior amarilla */}
        <path d="M43 80 Q40 90 42 96 Q46 92 48 84 Z" fill="url(#fireInner)" />
      </g>

      {/* Cuerpo del Cohete en diagonal 45° */}
      <g transform="rotate(-40 62 58)">
        {/* Aletas laterales */}
        <path d="M48 64 L38 78 L52 74 Z" fill="#b45309" />
        <path d="M72 64 L82 78 L68 74 Z" fill="#d97706" />

        {/* Fuselaje Principal */}
        <path d="M60 22 C70 34 72 58 70 72 L50 72 C48 58 50 34 60 22 Z" fill="url(#rocketBody)" stroke="#ffffff" strokeWidth="1.5" />

        {/* Punta del Cohete */}
        <path d="M60 22 C66 30 68 40 68 42 L52 42 C52 40 54 30 60 22 Z" fill="#ef4444" />

        {/* Ventanilla de Cristal */}
        <circle cx="60" cy="52" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="58" cy="50" r="2" fill="#ffffff" />
      </g>

      {/* Planeta con anillo al fondo */}
      <g className="animate-star-twinkle" opacity="0.6">
        <circle cx="96" cy="30" r="8" fill="url(#planetGrad)" />
        <ellipse cx="96" cy="30" rx="14" ry="4" stroke="rgba(255,255,255,0.6)" strokeWidth="1" transform="rotate(-20 96 30)" />
      </g>

      {/* Destellos / Estrellas */}
      <path d="M84 76 L86 70 L88 76 L94 78 L88 80 L86 86 L84 80 L78 78 Z" fill="#ffffff" className="animate-star-twinkle" />
      <circle cx="26" cy="38" r="2" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1s' }} />

      <defs>
        <linearGradient id="rocketBody" x1="50" y1="22" x2="70" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="fireOuter" x1="42" y1="78" x2="40" y2="102" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id="fireInner" x1="43" y1="80" x2="42" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="planetGrad" x1="88" y1="22" x2="104" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fed7aa" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// ====================================================================
// 3. ILUSTRACIÓN: CLIENTES CON PLAN (Corona Real VIP + Diamante 3D)
// ====================================================================
export const CrownVipIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center select-none pointer-events-none ${className}`}>
    <div className="absolute w-16 h-16 rounded-full bg-emerald-400/25 blur-lg animate-pulse" />

    {/* SVG Corona de Oro VIP y Diamante Facetado */}
    <svg viewBox="0 0 120 120" className="w-full h-full animate-card-float drop-shadow-2xl" fill="none">
      {/* Halo de luz dorado de fondo */}
      <circle cx="60" cy="58" r="38" fill="url(#crownHalo)" opacity="0.35" />

      {/* Corona de Oro 3D */}
      <g>
        {/* Base de la corona */}
        <ellipse cx="60" cy="74" rx="32" ry="7" fill="url(#crownBaseGrad)" stroke="#fef08a" strokeWidth="1.5" />

        {/* Picos de la corona con piedras preciosas */}
        <path
          d="M28 72 L32 44 L46 58 L60 34 L74 58 L88 44 L92 72 Z"
          fill="url(#crownBodyGrad)"
          stroke="#ffffff"
          strokeWidth="1.5"
        />

        {/* Joyas en las puntas */}
        <circle cx="32" cy="44" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" className="animate-star-twinkle" />
        <circle cx="60" cy="34" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="animate-coin-gleam" />
        <circle cx="88" cy="44" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" className="animate-star-twinkle" style={{ animationDelay: '0.8s' }} />

        {/* Joyas incrustadas en la banda base */}
        <circle cx="45" cy="74" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
        <circle cx="60" cy="74" r="3.5" fill="#ec4899" stroke="#ffffff" strokeWidth="1" />
        <circle cx="75" cy="74" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
      </g>

      {/* Diamante Facetado Flotando Frente a la Corona */}
      <g className="animate-card-float-delayed" transform="translate(18, 12)">
        <polygon points="50,42 62,42 68,48 50,62 32,48 38,42" fill="url(#gemTopGrad)" stroke="#ffffff" strokeWidth="1.2" />
        <polygon points="38,42 50,48 50,62 32,48" fill="url(#gemLeftGrad)" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
        <polygon points="62,42 50,48 50,62 68,48" fill="url(#gemRightGrad)" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
      </g>

      {/* Destellos / Estrellas de 4 puntas */}
      <path d="M24 36 L26 28 L28 36 L36 38 L28 40 L26 48 L24 40 L16 38 Z" fill="#ffffff" className="animate-star-twinkle" />
      <path d="M96 64 L97 58 L99 64 L104 65 L99 67 L97 72 L96 67 L91 65 Z" fill="#fef08a" className="animate-star-twinkle" style={{ animationDelay: '1.2s' }} />

      <defs>
        <radialGradient id="crownHalo" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 58) scale(38)">
          <stop stopColor="#fef08a" />
          <stop offset="1" stopColor="#fef08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="crownBodyGrad" x1="28" y1="34" x2="92" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="crownBaseGrad" x1="28" y1="74" x2="92" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="gemTopGrad" x1="32" y1="42" x2="68" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="gemLeftGrad" x1="32" y1="42" x2="50" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bae6fd" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="gemRightGrad" x1="50" y1="42" x2="68" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// ====================================================================
// 4. ILUSTRACIÓN: INGRESOS MENSUALES (Pila de Monedas de Oro 3D + Billetes)
// ====================================================================
export const MoneyCoinsIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center select-none pointer-events-none ${className}`}>
    <div className="absolute w-16 h-16 rounded-full bg-rose-400/25 blur-lg animate-pulse" />

    {/* SVG Pila de Monedas de Oro y Billetes con Destellos */}
    <svg viewBox="0 0 120 120" className="w-full h-full animate-card-float drop-shadow-2xl" fill="none">
      {/* Billete Flotante Inclinado al Fondo */}
      <g transform="rotate(-15 68 42)" className="animate-card-float-delayed" opacity="0.95">
        <rect x="42" y="28" width="52" height="28" rx="4" fill="url(#billGrad)" stroke="#ffffff" strokeWidth="1.2" />
        <rect x="45" y="31" width="46" height="22" rx="2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeDasharray="2 2" />
        <circle cx="68" cy="42" r="7" fill="rgba(255,255,255,0.25)" />
        <text x="68" y="46" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif">$</text>
      </g>

      {/* Pila de Monedas Izquierda (3 Monedas) */}
      <g>
        {/* Moneda 1 (Base) */}
        <ellipse cx="44" cy="88" rx="18" ry="7" fill="#b45309" />
        <ellipse cx="44" cy="85" rx="18" ry="7" fill="url(#coinFaceGrad)" stroke="#fef08a" strokeWidth="1" />

        {/* Moneda 2 */}
        <ellipse cx="44" cy="79" rx="18" ry="7" fill="#b45309" />
        <ellipse cx="44" cy="76" rx="18" ry="7" fill="url(#coinFaceGrad)" stroke="#fef08a" strokeWidth="1" />

        {/* Moneda 3 (Tope) */}
        <ellipse cx="44" cy="70" rx="18" ry="7" fill="#b45309" />
        <ellipse cx="44" cy="67" rx="18" ry="7" fill="url(#coinFaceGrad)" stroke="#fef08a" strokeWidth="1.2" />
        <text x="44" y="70" fontSize="8" fontWeight="black" textAnchor="middle" fill="#78350f" fontFamily="sans-serif">$</text>
      </g>

      {/* Pila de Monedas Derecha (Más alta, 4 Monedas) */}
      <g>
        {/* Moneda 1 (Base) */}
        <ellipse cx="78" cy="94" rx="20" ry="8" fill="#b45309" />
        <ellipse cx="78" cy="91" rx="20" ry="8" fill="url(#coinFaceGrad)" stroke="#fef08a" strokeWidth="1" />

        {/* Moneda 2 */}
        <ellipse cx="78" cy="84" rx="20" ry="8" fill="#b45309" />
        <ellipse cx="78" cy="81" rx="20" ry="8" fill="url(#coinFaceGrad)" stroke="#fef08a" strokeWidth="1" />

        {/* Moneda 3 */}
        <ellipse cx="78" cy="74" rx="20" ry="8" fill="#b45309" />
        <ellipse cx="78" cy="71" rx="20" ry="8" fill="url(#coinFaceGrad)" stroke="#fef08a" strokeWidth="1" />

        {/* Moneda 4 (Tope con símbolo) */}
        <ellipse cx="78" cy="64" rx="20" ry="8" fill="#b45309" />
        <ellipse cx="78" cy="61" rx="20" ry="8" fill="url(#coinFaceGrad2)" stroke="#ffffff" strokeWidth="1.5" />
        <ellipse cx="78" cy="61" rx="15" ry="5.5" fill="none" stroke="#d97706" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        <text x="78" y="65" fontSize="10" fontWeight="black" textAnchor="middle" fill="#78350f" fontFamily="sans-serif">$</text>
      </g>

      {/* Moneda Dorada Flotante con Brillo */}
      <g className="animate-coin-gleam" transform="translate(14, -12)">
        <ellipse cx="64" cy="38" rx="14" ry="14" fill="url(#coinFloatGrad)" stroke="#ffffff" strokeWidth="1.5" />
        <ellipse cx="64" cy="38" rx="10" ry="10" fill="none" stroke="#fef08a" strokeWidth="1" />
        <text x="64" y="43" fontSize="12" fontWeight="black" textAnchor="middle" fill="#78350f" fontFamily="sans-serif">$</text>
      </g>

      {/* Destellos de Brillo / Estrellas Doradas */}
      <path d="M22 62 L24 54 L26 62 L32 64 L26 66 L24 74 L22 66 L14 64 Z" fill="#ffffff" className="animate-star-twinkle" />
      <path d="M98 42 L99 36 L101 42 L106 43 L101 45 L99 50 L98 45 L93 43 Z" fill="#fef08a" className="animate-star-twinkle" style={{ animationDelay: '1s' }} />
      <circle cx="68" cy="18" r="2.5" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1.5s' }} />

      <defs>
        <linearGradient id="billGrad" x1="42" y1="28" x2="94" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="0.5" stopColor="#059669" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="coinFaceGrad" x1="24" y1="60" x2="64" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="coinFaceGrad2" x1="58" y1="53" x2="98" y2="69" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#fef08a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id="coinFloatGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 34) scale(16)">
          <stop stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#fde047" />
          <stop offset="1" stopColor="#d97706" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

// ====================================================================
// 5. ILUSTRACIÓN: NEGOCIOS / EMPRESAS (Edificio Comercial 3D con Toldo)
// ====================================================================
export const BuildingStoreIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center select-none pointer-events-none ${className}`}>
    <div className="absolute w-16 h-16 rounded-full bg-blue-400/25 blur-lg animate-pulse" />

    <svg viewBox="0 0 120 120" className="w-full h-full animate-card-float drop-shadow-2xl" fill="none">
      {/* Sombra base */}
      <ellipse cx="60" cy="98" rx="38" ry="8" fill="rgba(0,0,0,0.25)" />

      {/* Fachada del Edificio */}
      <rect x="32" y="38" width="56" height="58" rx="8" fill="url(#storeFacadeGrad)" stroke="#ffffff" strokeWidth="1.5" />

      {/* Ventanas piso superior */}
      <rect x="40" y="44" width="10" height="12" rx="2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
      <rect x="55" y="44" width="10" height="12" rx="2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
      <rect x="70" y="44" width="10" height="12" rx="2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />

      {/* Toldo Comercial Rayado (Awning 3D) */}
      <g>
        <path d="M26 62 L94 62 L88 74 L32 74 Z" fill="url(#awningGrad)" stroke="#ffffff" strokeWidth="1.2" />
        {/* Rayas blancas del toldo */}
        <polygon points="36,62 44,62 42,74 34,74" fill="#ffffff" opacity="0.85" />
        <polygon points="52,62 60,62 58,74 50,74" fill="#ffffff" opacity="0.85" />
        <polygon points="68,62 76,62 74,74 66,74" fill="#ffffff" opacity="0.85" />
        <polygon points="84,62 92,62 90,74 82,74" fill="#ffffff" opacity="0.85" />
      </g>

      {/* Puerta de Cristal y Escaparate */}
      <rect x="52" y="76" width="16" height="20" rx="3" fill="#bae6fd" stroke="#ffffff" strokeWidth="1.2" />
      <line x1="60" y1="76" x2="60" y2="96" stroke="#ffffff" strokeWidth="1" />
      <circle cx="58" cy="86" r="1" fill="#0284c7" />

      {/* Ventanales inferiores */}
      <rect x="36" y="78" width="12" height="14" rx="2" fill="#e0f2fe" stroke="#ffffff" strokeWidth="1" />
      <rect x="72" y="78" width="12" height="14" rx="2" fill="#e0f2fe" stroke="#ffffff" strokeWidth="1" />

      {/* Pin de Ubicación / Tienda Flotante */}
      <g className="animate-card-float-delayed" transform="translate(48, 10)">
        <path d="M12 2 C6.5 2 2 6.5 2 12 C2 18.5 12 28 12 28 C12 28 22 18.5 22 12 C22 6.5 17.5 2 12 2 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="12" cy="11" r="4" fill="#ffffff" />
      </g>

      {/* Destellos */}
      <path d="M22 46 L24 40 L26 46 L32 48 L26 50 L24 56 L22 50 L16 48 Z" fill="#ffffff" className="animate-star-twinkle" />
      <circle cx="96" cy="48" r="2.5" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1s' }} />

      <defs>
        <linearGradient id="storeFacadeGrad" x1="32" y1="38" x2="88" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="awningGrad" x1="26" y1="62" x2="94" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// ====================================================================
// 6. ILUSTRACIÓN: PLANES Y TIERS (Capas 3D Holográficas + Medalla VIP)
// ====================================================================
export const LayersPlanesIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center select-none pointer-events-none ${className}`}>
    <div className="absolute w-16 h-16 rounded-full bg-amber-400/25 blur-lg animate-pulse" />

    <svg viewBox="0 0 120 120" className="w-full h-full animate-card-float drop-shadow-2xl" fill="none">
      {/* Capa Inferior 3D (Plan 1) */}
      <g transform="translate(0, 18)" opacity="0.6">
        <polygon points="60,62 98,78 60,94 22,78" fill="url(#tierBottom)" stroke="#ffffff" strokeWidth="1.2" />
      </g>

      {/* Capa Media 3D (Plan 2) */}
      <g transform="translate(0, 8)" opacity="0.85">
        <polygon points="60,48 98,64 60,80 22,64" fill="url(#tierMid)" stroke="#ffffff" strokeWidth="1.2" />
      </g>

      {/* Capa Superior 3D (Plan 3 Premium) */}
      <g>
        <polygon points="60,34 98,50 60,66 22,50" fill="url(#tierTop)" stroke="#ffffff" strokeWidth="1.5" />
        {/* Línea interior dorada */}
        <polygon points="60,38 90,50 60,62 30,50" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="2 2" />
      </g>

      {/* Medalla / Estrella Flotando Encima de las Capas */}
      <g className="animate-star-twinkle" transform="translate(48, 14)">
        <circle cx="12" cy="12" r="11" fill="url(#badgeGold)" stroke="#ffffff" strokeWidth="1.5" />
        <path d="M12 6 L13.8 9.8 L18 10.4 L15 13.3 L15.7 17.5 L12 15.5 L8.3 17.5 L9 13.3 L6 10.4 L10.2 9.8 Z" fill="#ffffff" />
      </g>

      {/* Destellos */}
      <path d="M96 32 L97 26 L99 32 L104 33 L99 35 L97 40 L96 35 L91 33 Z" fill="#fef08a" className="animate-star-twinkle" />
      <path d="M24 64 L25 58 L27 64 L32 65 L27 67 L25 72 L24 67 L19 65 Z" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1.2s' }} />

      <defs>
        <linearGradient id="tierBottom" x1="22" y1="62" x2="98" y2="94" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="tierMid" x1="22" y1="48" x2="98" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="tierTop" x1="22" y1="34" x2="98" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="badgeGold" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);
