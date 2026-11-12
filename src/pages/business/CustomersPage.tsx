import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Customer } from '@/types';

export const CustomersPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false });
      if (data) setCustomers(data as Customer[]);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeBusiness]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !name.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('customers').insert({
        business_id: activeBusiness.id,
        name: name.trim(),
        identification: identification.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        is_active: true,
      });

      if (error) throw error;

      setName('');
      setIdentification('');
      setEmail('');
      setPhone('');
      setAddress('');
      setIsModalOpen(false);
      await fetchCustomers();
    } catch (err: any) {
      alert(`Error al guardar cliente: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Gestiona la cartera de clientes, datos de contacto y fidelización
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Nuevo Cliente
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            Cargando clientes...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-zinc-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No hay clientes registrados.</p>
            <p className="text-xs mt-1">Registra a tus clientes frecuentes para asociarlos a sus compras.</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
            >
              Registrar Cliente
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-800/60 uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800 font-bold">
                <tr>
                  <th className="px-6 py-3.5">Nombre</th>
                  <th className="px-6 py-3.5">Identificación / RNC</th>
                  <th className="px-6 py-3.5">Teléfono</th>
                  <th className="px-6 py-3.5">Correo</th>
                  <th className="px-6 py-3.5">Dirección</th>
                  <th className="px-6 py-3.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-zinc-100">{c.name}</td>
                    <td className="px-6 py-4 font-mono text-gray-500">{c.identification || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-zinc-400">{c.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-zinc-400">{c.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{c.address || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="emerald" size="sm">Activo</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Cliente"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Nombre Completo / Razón Social *"
            placeholder="Ej. Distribuidora Gómez S.R.L. o María López"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="RNC / Cédula / DNI"
              placeholder="001-0000000-0"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
            />

            <Input
              label="Teléfono"
              placeholder="+1 (809) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="cliente@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Dirección"
              placeholder="Calle, Sector, Ciudad"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Guardar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
