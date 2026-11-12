import React, { useState, useEffect } from 'react';
import {
  Store,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Building2,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { uploadBusinessAsset } from '@/services/storage';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BUSINESS_TYPES, COUNTRIES } from '@/utils/formatters';

export const SettingsPage: React.FC = () => {
  const {
    activeBusiness,
    settings,
    currentRole,
    updateActiveBusiness,
    updateSettings,
  } = useBusiness();

  // Business state
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [country, setCountry] = useState('DO');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('America/Santo_Domingo');

  // Media state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Business settings state
  const [receiptFooter, setReceiptFooter] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('18');
  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('FAC-');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
      setBusinessType(activeBusiness.business_type || 'retail');
      setCountry(activeBusiness.country || 'DO');
      setCity(activeBusiness.city || '');
      setAddress(activeBusiness.address || '');
      setPhone(activeBusiness.phone || '');
      setCurrency(activeBusiness.currency || 'USD');
      setTimezone(activeBusiness.timezone || 'America/Santo_Domingo');
      setLogoPreview(activeBusiness.logo_url || null);
      setCoverPreview(activeBusiness.cover_url || null);
    }
    if (settings) {
      setReceiptFooter(settings.receipt_footer || '');
      setTaxPercentage(String(settings.tax_percentage ?? 18));
      setTaxIdNumber(settings.tax_id_number || '');
      setInvoicePrefix(settings.invoice_prefix || 'FAC-');
    }
  }, [activeBusiness, settings]);

  const canEdit = currentRole === 'owner' || currentRole === 'admin';

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setMessage(null);

    try {
      setSaving(true);

      let newLogoUrl = activeBusiness?.logo_url;
      let newCoverUrl = activeBusiness?.cover_url;

      if (logoFile) {
        const { url, error: logoErr } = await uploadBusinessAsset(logoFile, 'logos', 'logo');
        if (!logoErr && url) newLogoUrl = url;
      }

      if (coverFile) {
        const { url, error: coverErr } = await uploadBusinessAsset(coverFile, 'covers', 'cover');
        if (!coverErr && url) newCoverUrl = url;
      }

      // Update business info
      const { error: bErr } = await updateActiveBusiness({
        name: name.trim(),
        business_type: businessType as any,
        country,
        city: city.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        currency,
        timezone,
        logo_url: newLogoUrl,
        cover_url: newCoverUrl,
      });

      if (bErr) throw bErr;

      // Update business settings
      const { error: sErr } = await updateSettings({
        receipt_footer: receiptFooter.trim(),
        tax_percentage: parseFloat(taxPercentage) || 0,
        tax_id_number: taxIdNumber.trim() || null,
        invoice_prefix: invoicePrefix.trim() || 'FAC-',
      });

      if (sErr) throw sErr;

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error al guardar cambios.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
          Configuración del Negocio
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Administra la identidad corporativa, impuestos y parámetros de facturación
        </p>
      </div>

      {!canEdit && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Solo los usuarios con rol Propietario o Administrador pueden modificar esta configuración.</span>
        </div>
      )}

      {message && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-800 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identidad y Marca */}
        <Card>
          <CardHeader>
            <CardTitle>Identidad y Marca</CardTitle>
            <CardDescription>Logotipo y portada mostrados en el sistema y recibos</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                Logotipo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                {canEdit && (
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-semibold text-gray-700 dark:text-zinc-200 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Subir nuevo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                Imagen de Portada
              </label>
              <div className="w-full h-20 rounded-2xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden relative group">
                {coverPreview ? (
                  <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    Sin portada
                  </div>
                )}
                {canEdit && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-xs text-white font-semibold flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" /> Cambiar portada
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Información Comercial */}
        <Card>
          <CardHeader>
            <CardTitle>Información Comercial</CardTitle>
            <CardDescription>Datos principales del establecimiento</CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre Comercial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                required
              />

              <Select
                label="Giro o Rubro Comercial"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                options={BUSINESS_TYPES}
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="País"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
                disabled={!canEdit}
              />

              <Input
                label="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Dirección"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!canEdit}
              />

              <Input
                label="Teléfono / Contacto"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Moneda"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'DOP', label: 'DOP (RD$)' },
                  { value: 'MXN', label: 'MXN ($)' },
                  { value: 'COP', label: 'COP ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'PEN', label: 'PEN (S/.)' },
                  { value: 'CLP', label: 'CLP ($)' },
                  { value: 'ARS', label: 'ARS ($)' },
                ]}
                disabled={!canEdit}
              />

              <Input
                label="Zona Horaria"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </Card>

        {/* Facturación y Comprobantes */}
        <Card>
          <CardHeader>
            <CardTitle>Facturación y Recibos</CardTitle>
            <CardDescription>Parámetros fiscales y encabezados de comprobantes de venta</CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="RNC / CIF / RFC / NIT"
                placeholder="Identificador fiscal"
                value={taxIdNumber}
                onChange={(e) => setTaxIdNumber(e.target.value)}
                disabled={!canEdit}
              />

              <Input
                label="Impuesto (%) ITBIS / IVA"
                type="number"
                step="0.01"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                disabled={!canEdit}
                icon={<Percent className="w-4 h-4" />}
              />

              <Input
                label="Prefijo de Factura"
                placeholder="FAC-"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
                Mensaje al Pie del Recibo / Ticket
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 p-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Ej. ¡Gracias por su compra! No se aceptan devoluciones sin factura."
              />
            </div>
          </div>
        </Card>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="md"
              loading={saving}
              icon={<Save className="w-4 h-4" />}
            >
              Guardar Cambios
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
