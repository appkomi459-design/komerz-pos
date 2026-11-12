import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Branch } from '@/types';

export const BranchesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('branches')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('is_main', { ascending: false });
      if (data) setBranches(data as Branch[]);
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [activeBusiness]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !name.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('branches').insert({
        business_id: activeBusiness.id,
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        is_main: false,
        is_active: true,
      });

      if (error) throw error;

      setName('');
      setAddress('');
      setPhone('');
      setIsModalOpen(false);
      await fetchBranches();
    } catch (err: any) {
      alert(`Error al crear sucursal: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Sucursales del Negocio
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Administra los locales físicos, almacenes y puntos de venta independientes
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Nueva Sucursal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Cargando sucursales...
          </div>
        ) : (
          branches.map((b) => (
            <Card key={b.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{b.name}</h3>
                  </div>
                  {b.is_main ? (
                    <Badge variant="emerald" size="sm">Principal</Badge>
                  ) : (
                    <Badge variant="gray" size="sm">Secundaria</Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 dark:text-zinc-400 mt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{b.address || 'Sin dirección registrada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{b.phone || 'Sin teléfono'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-gray-400">
                <span>Estado: <strong className="text-emerald-600">Activa</strong></span>
                <span className="font-mono text-[10px]">{b.id.substring(0, 8)}...</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Sucursal"
        description="Agrega una nueva sucursal comercial a este negocio"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <Input
            label="Nombre de la Sucursal *"
            placeholder="Ej. Sucursal Plaza Central, Almacén Norte"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Dirección"
            placeholder="Avenida, Local, Sector"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            label="Teléfono"
            placeholder="+1 (809) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear Sucursal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
