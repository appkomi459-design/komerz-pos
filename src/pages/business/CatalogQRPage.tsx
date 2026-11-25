import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Link2,
  Copy,
  CheckCheck,
  Download,
  Share2,
  ExternalLink,
  Store,
  Eye,
  Smartphone,
  Globe,
  MessageCircle,
  Save,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { COUNTRIES } from '@/utils/formatters';

const DIAL_CODES: Record<string, string> = {
  BO: '+591',
  BR: '+55',
  PY: '+595',
  UY: '+598',
  PE: '+51',
  EC: '+593',
  PA: '+507',
  SV: '+503',
  CO: '+57',
  MX: '+52',
  CL: '+56',
  AR: '+54',
  DO: '+1',
  GT: '+502',
  CR: '+506',
  HN: '+504',
  NI: '+505',
  US: '+1',
  ES: '+34',
  PT: '+351',
  FR: '+33',
  IT: '+39',
  DE: '+49',
  GB: '+44',
  CH: '+41',
  NL: '+31',
  BE: '+32',
  IE: '+353',
  AT: '+43',
  SE: '+46',
};

const PHONE_COUNTRIES = COUNTRIES.filter((c) => DIAL_CODES[c.code]).map((c) => ({
  code: c.code,
  name: c.name,
  dial: DIAL_CODES[c.code],
}));

export const CatalogQRPage: React.FC = () => {
  const { activeBusiness, updateActiveBusiness } = useBusiness();
  const [copied, setCopied] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('BO');
  const [localPhone, setLocalPhone] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const qrRef = useRef<SVGSVGElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const raw = (activeBusiness?.phone || '').trim();
    const defaultCode =
      activeBusiness?.country && DIAL_CODES[activeBusiness.country]
        ? activeBusiness.country
        : 'BO';

    if (!raw) {
      setSelectedCountryCode(defaultCode);
      setLocalPhone('');
      setPhoneStatus('idle');
      return;
    }

    const normalized = raw.startsWith('+') ? raw : `+${raw}`;
    // Buscar el prefijo más largo que coincida
    const sortedByDialLen = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    const matched =
      sortedByDialLen.find(
        (c) => c.code === defaultCode && normalized.startsWith(c.dial)
      ) || sortedByDialLen.find((c) => normalized.startsWith(c.dial));

    if (matched) {
      setSelectedCountryCode(matched.code);
      setLocalPhone(normalized.slice(matched.dial.length).trim());
    } else {
      setSelectedCountryCode(defaultCode);
      setLocalPhone(raw.replace(/^\+/, ''));
    }
    setPhoneStatus('idle');
  }, [activeBusiness?.id, activeBusiness?.phone, activeBusiness?.country]);

  const selectedPhoneCountry =
    PHONE_COUNTRIES.find((c) => c.code === selectedCountryCode) || PHONE_COUNTRIES[0];

  const filteredPhoneCountries = PHONE_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    setSavingPhone(true);
    setPhoneStatus('idle');
    const digits = localPhone.replace(/\D/g, '');
    const fullPhone = digits ? `${selectedPhoneCountry.dial}${digits}` : '';
    const { error } = await updateActiveBusiness({
      phone: fullPhone || (null as unknown as string),
    });
    setSavingPhone(false);
    if (error) {
      setPhoneStatus('error');
    } else {
      setPhoneStatus('saved');
      setTimeout(() => setPhoneStatus('idle'), 3000);
    }
  };

  const catalogUrl = activeBusiness
    ? `${window.location.origin}/c/${activeBusiness.id}`
    : '';

  const handleCopy = async () => {
    if (!catalogUrl) return;
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = catalogUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `qr-catalogo-${activeBusiness?.name ?? 'negocio'}.png`;
      a.click();
    };
    img.src = url;
  };

  const handleShare = async () => {
    if (!catalogUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: `Catálogo de ${activeBusiness?.name ?? 'mi negocio'}`,
        text: `¡Visita nuestro catálogo de productos!`,
        url: catalogUrl,
      });
    } else {
      handleCopy();
    }
  };

  const handleOpenCatalog = () => {
    if (catalogUrl) window.open(catalogUrl, '_blank');
  };

  if (!activeBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-zinc-400 text-sm font-bold">
          Selecciona un negocio para ver tu catálogo QR.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              QR Catálogo
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Comparte tu tienda en línea con clientes
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCatalog}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          Ver Catálogo
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* QR Code Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm p-6 flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 self-start">
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Código QR de tu Catálogo
            </span>
          </div>

          {/* QR Display */}
          <div className="relative">
            <div className="p-5 bg-white rounded-3xl shadow-xl ring-1 ring-slate-200">
              <QRCodeSVG
                ref={qrRef}
                value={catalogUrl}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#1e1b4b"
                bgColor="#ffffff"
              />
            </div>
            {/* Store icon overlay center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center ring-1 ring-slate-100">
                <Store className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold text-center">
            Escanea con la cámara del celular para ver tu catálogo
          </p>

          {/* Download Button */}
          <button
            onClick={handleDownloadQR}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar QR (PNG)
          </button>
        </div>

        {/* Link & Share Card */}
        <div className="flex flex-col gap-4">

          {/* Link Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Enlace de tu Catálogo
              </span>
            </div>

            {/* URL Display */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 rounded-2xl p-3 border border-slate-200 dark:border-zinc-700">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-xs font-mono text-slate-600 dark:text-zinc-300 flex-1 truncate font-bold">
                {catalogUrl}
              </p>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                copied
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  ¡Enlace Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Enlace
                </>
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Compartir Catálogo
            </button>
          </div>

          {/* WhatsApp Phone Config Card */}
          <form
            onSubmit={handleSavePhone}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  WhatsApp para Pedidos
                </span>
              </div>
              {activeBusiness.phone ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Activo
                </span>
              ) : (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Sin configurar
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              Elige tu país e ingresa tu número de WhatsApp para recibir los pedidos del carrito.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-1 gap-2 relative" ref={countryDropdownRef}>
                {/* Selector de País con Bandera */}
                <button
                  type="button"
                  onClick={() => setIsCountryOpen((o) => !o)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 rounded-xl flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-zinc-100 transition-colors cursor-pointer shrink-0"
                  title={selectedPhoneCountry.name}
                >
                  <img
                    src={`https://flagcdn.com/w40/${selectedPhoneCountry.code.toLowerCase()}.png`}
                    alt={selectedPhoneCountry.name}
                    className="w-5 h-3.5 object-cover rounded shadow-xs border border-black/10 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="font-mono text-xs font-black">{selectedPhoneCountry.dial}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown de Países */}
                {isCountryOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-zinc-800">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Buscar país o código (+591)..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {filteredPhoneCountries.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4 font-medium">
                          No se encontró el país
                        </p>
                      ) : (
                        filteredPhoneCountries.map((c) => {
                          const isSelected = c.code === selectedPhoneCountry.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountryCode(c.code);
                                setIsCountryOpen(false);
                                setCountrySearch('');
                              }}
                              className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black'
                                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-semibold'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                                  alt={c.name}
                                  className="w-5 h-3.5 object-cover rounded shadow-xs border border-black/10 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <span className="truncate">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                                  {c.dial}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Input Número Local */}
                <input
                  type="tel"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  placeholder="Ej: 71234567"
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingPhone}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingPhone ? 'Guardando...' : 'Guardar WhatsApp'}</span>
              </button>
            </div>

            {phoneStatus === 'saved' && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ¡Número guardado! El botón de WhatsApp ya está activo en tu catálogo.
              </p>
            )}
            {phoneStatus === 'error' && (
              <p className="text-xs font-bold text-rose-500">
                No se pudo guardar el número. Verifica tus permisos o intenta de nuevo.
              </p>
            )}
          </form>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-100">CATÁLOGO</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-black tracking-tight">En línea</div>
                <p className="text-[10px] text-indigo-100 font-bold mt-0.5">Acceso 24/7</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">PRODUCTOS</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-black tracking-tight">Público</div>
                <p className="text-[10px] text-emerald-100 font-bold mt-0.5">Sin login</p>
              </div>
            </div>
          </div>

          {/* How to use card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                ¿Cómo usarlo?
              </span>
            </div>
            <ul className="space-y-2">
              {[
                { step: '1', text: 'Descarga el QR e imprímelo en tu local' },
                { step: '2', text: 'Comparte el enlace por WhatsApp o redes sociales' },
                { step: '3', text: 'Los clientes ven tu catálogo y precios en su celular' },
                { step: '4', text: 'El catálogo se actualiza automáticamente al editar productos' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
