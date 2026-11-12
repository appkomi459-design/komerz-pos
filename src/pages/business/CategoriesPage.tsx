import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, FolderPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Category } from '@/types';

export const CategoriesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .order('created_at', { ascending: false });
      if (data) setCategories(data as Category[]);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeBusiness]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !name.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('categories').insert({
        business_id: activeBusiness.id,
        name: name.trim(),
        description: description.trim() || null,
        is_active: true,
      });

      if (error) throw error;

      setName('');
      setDescription('');
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      alert(`Error al crear categoría: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Categorías
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Organiza tus productos por departamentos, familias o rubros
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Nueva Categoría
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Cargando categorías...
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 dark:text-zinc-500">
            <Tags className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No hay categorías registradas.</p>
            <p className="text-xs mt-1">Crea categorías como "Bebidas", "Abarrotes", "Lácteos", etc.</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="mt-4"
              icon={<FolderPlus className="w-4 h-4" />}
            >
              Crear Categoría
            </Button>
          </div>
        ) : (
          categories.map((c) => (
            <Card key={c.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{c.name}</h3>
                  <Badge variant="emerald" size="sm">Activa</Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                  {c.description || 'Sin descripción'}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Categoría"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Nombre de la Categoría *"
            placeholder="Ej. Alimentos, Ferretería, Bebidas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5">
              Descripción
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 p-2.5 focus:outline-none focus:border-emerald-500"
              placeholder="Opcional..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Guardar Categoría
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
