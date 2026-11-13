import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Upload,
  Globe,
  MapPin,
  Phone,
  DollarSign,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { uploadBusinessAsset } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { Card } from '@/components/ui/Card';
import { BUSINESS_TYPES, COUNTRIES } from '@/utils/formatters';

export const OnboardingWizardPage: React.FC = () => {
  const { createBusiness } = useBusiness();
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Form fields
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [country, setCountry] = useState('BO');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('BOB');
  const [timezone, setTimezone] = useState('America/La_Paz');

  // Media files & previews
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill currency and timezone based on country selection
  const handleCountryChange = (cCode: string) => {
    setCountry(cCode);
    const found = COUNTRIES.find((c) => c.code === cCode);
    if (found) {
      setCurrency(found.currency);
      setTimezone(found.timezone);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Por favor indica el nombre comercial de tu negocio.');
      return;
    }
    setStep(2);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      let uploadedLogoUrl: string | null = null;
      let uploadedCoverUrl: string | null = null;

      // 1. Subir logotipo si existe
      if (logoFile) {
        const { url, error: logoErr } = await uploadBusinessAsset(logoFile, 'logos', 'logo');
        if (logoErr) {
          console.warn('Advertencia al subir logo:', logoErr);
        } else {
          uploadedLogoUrl = url;
        }
      }

      // 2. Subir imagen de portada si existe
      if (coverFile) {
        const { url, error: coverErr } = await uploadBusinessAsset(coverFile, 'covers', 'cover');
        if (coverErr) {
          console.warn('Advertencia al subir portada:', coverErr);
        } else {
          uploadedCoverUrl = url;
        }
      }

      // 3. Crear el negocio en Supabase
      const { business, error: createError } = await createBusiness({
        name: name.trim(),
        business_type: businessType,
        country,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        currency,
        timezone,
        logo_url: uploadedLogoUrl,
        cover_url: uploadedCoverUrl,
      });

      if (createError || !business) {
        setError(createError?.message || 'Error al configurar el negocio.');
        return;
      }

      navigate('/app');
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al registrar el negocio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-emerald-50/20 to-gray-100 dark:from-[#0d0d0f] dark:via-[#111614] dark:to-[#0e0e10] text-gray-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-100">
            Configuración de tu Negocio
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            Completa estos datos básicos para activar tu punto de venta en segundos
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  step >= 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'
                }`}
              >
                1
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Identidad & Ubicación
              </span>
            </div>
            <div className="w-10 h-0.5 bg-gray-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  step >= 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-zinc-800 text-gray-500'
                }`}
              >
                2
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Marca & Moneda
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <Card className="shadow-xl">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-5">
              <Input
                label="Nombre Comercial del Negocio *"
                placeholder="Ej. Minimarket Don Pepe, Boutique Bella, Ferretería El Roble"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<Store className="w-4 h-4" />}
                required
              />

              <Select
                label="Tipo o Giro de Negocio *"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                options={BUSINESS_TYPES}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CountrySelect
                  label="País de Operación *"
                  value={country}
                  onChange={handleCountryChange}
                />

                <Input
                  label="Ciudad"
                  placeholder="Ej. La Paz, Santa Cruz, Bogotá, Lima"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Dirección Física"
                  placeholder="Calle, Número, Sector"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  icon={<Building2 className="w-4 h-4" />}
                />

                <Input
                  label="Teléfono / WhatsApp"
                  placeholder="+1 (809) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Continuar al Paso 2
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinish} className="space-y-6">
              {/* Logo & Cover Upload via Supabase Storage */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                    Logotipo del Negocio (Opcional)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-semibold text-gray-700 dark:text-zinc-200 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Subir Logotipo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoSelect}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                    Fotografía o Portada (Opcional)
                  </label>
                  <div className="w-full h-28 rounded-2xl bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center overflow-hidden relative group">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-500">Imagen de fachada o banner</span>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-gray-900 text-xs font-semibold">
                        <Upload className="w-3.5 h-3.5" />
                        Cambiar Portada
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverSelect}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Currency and Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencySelect
                  label="Moneda Principal de Facturación *"
                  value={currency}
                  onChange={(newCurr) => setCurrency(newCurr)}
                />

                <Input
                  label="Zona Horaria *"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  icon={<Clock className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Atrás
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Finalizar y Abrir Negocio
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
