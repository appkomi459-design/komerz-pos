import { supabase } from '@/integrations/supabase/client';

export type TrashItemType =
  | 'product'
  | 'category'
  | 'customer'
  | 'supplier'
  | 'expense'
  | 'branch'
  | 'sale'
  | 'employee';

export interface TrashItemRecord {
  id: string;
  business_id: string;
  item_type: TrashItemType;
  item_id: string;
  title: string;
  subtitle?: string | null;
  payload: Record<string, any>;
  deleted_by?: string | null;
  deleted_at: string;
  source?: 'db' | 'local' | 'inactive_product';
}

const LOCAL_KEY_PREFIX = 'komerz_trash_';

function getLocalTrash(businessId: string): TrashItemRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_KEY_PREFIX}${businessId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTrash(businessId: string, items: TrashItemRecord[]) {
  try {
    localStorage.setItem(`${LOCAL_KEY_PREFIX}${businessId}`, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export async function recordTrashItem(params: {
  businessId: string;
  itemType: TrashItemType;
  itemId: string;
  title: string;
  subtitle?: string;
  payload: Record<string, any>;
  deletedBy?: string | null;
}): Promise<void> {
  const { businessId, itemType, itemId, title, subtitle, payload, deletedBy } = params;
  const record: TrashItemRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    business_id: businessId,
    item_type: itemType,
    item_id: itemId,
    title,
    subtitle: subtitle || null,
    payload,
    deleted_by: deletedBy || null,
    deleted_at: new Date().toISOString(),
    source: 'db',
  };

  try {
    const { error } = await supabase.from('trash_items').insert({
      id: record.id,
      business_id: businessId,
      item_type: itemType,
      item_id: itemId,
      title,
      subtitle: subtitle || null,
      payload,
      deleted_by: deletedBy || null,
    });

    if (error) throw error;
  } catch {
    // Fallback local si la tabla trash_items aún no existe en Supabase
    const current = getLocalTrash(businessId);
    setLocalTrash(businessId, [{ ...record, source: 'local' }, ...current]);
  }
}

export async function fetchTrashItems(businessId: string): Promise<TrashItemRecord[]> {
  const localItems = getLocalTrash(businessId);
  let dbItems: TrashItemRecord[] = [];

  try {
    const { data, error } = await supabase
      .from('trash_items')
      .select('*')
      .eq('business_id', businessId)
      .order('deleted_at', { ascending: false });

    if (!error && data) {
      dbItems = data.map((d: any) => ({ ...d, source: 'db' as const }));
    }
  } catch {
    // ignore if table not migrated yet
  }

  // También detectar productos archivados (is_active = false) que no estén ya en trash_items
  let inactiveProducts: TrashItemRecord[] = [];
  try {
    const { data: prods } = await supabase
      .from('products')
      .select('id, business_id, name, sku, sale_price, stock, created_at')
      .eq('business_id', businessId)
      .eq('is_active', false);

    if (prods && prods.length > 0) {
      const existingProdIds = new Set(
        [...dbItems, ...localItems]
          .filter((i) => i.item_type === 'product')
          .map((i) => i.item_id)
      );
      inactiveProducts = prods
        .filter((p: any) => !existingProdIds.has(p.id))
        .map((p: any) => ({
          id: `inactive-${p.id}`,
          business_id: businessId,
          item_type: 'product' as const,
          item_id: p.id,
          title: p.name,
          subtitle: p.sku ? `SKU: ${p.sku} · Precio: ${p.sale_price}` : `Precio: ${p.sale_price}`,
          payload: { ...p, is_active: true },
          deleted_at: p.created_at || new Date().toISOString(),
          source: 'inactive_product' as const,
        }));
    }
  } catch {
    // ignore
  }

  return [...dbItems, ...localItems, ...inactiveProducts].sort(
    (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
  );
}

const TABLE_MAP: Partial<Record<TrashItemType, string>> = {
  product: 'products',
  category: 'categories',
  customer: 'customers',
  supplier: 'suppliers',
  expense: 'expenses',
  branch: 'branches',
  employee: 'business_members',
};

export async function restoreTrashItem(item: TrashItemRecord): Promise<{ error: string | null }> {
  try {
    if (item.source === 'inactive_product') {
      const { error } = await supabase
        .from('products')
        .update({ is_active: true })
        .eq('id', item.item_id);
      if (error) return { error: error.message };
      return { error: null };
    }

    const table = TABLE_MAP[item.item_type];
    if (!table) {
      return { error: 'Este tipo de registro (venta eliminada) es solo de historial y no se puede restaurar automáticamente.' };
    }

    if (item.item_type === 'product') {
      // Verificar si el producto sigue existiendo como inactivo
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('id', item.item_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('products')
          .update({ is_active: true })
          .eq('id', item.item_id);
        if (error) return { error: error.message };
      } else {
        const cleanPayload: Record<string, any> = { ...item.payload, is_active: true };
        delete cleanPayload.category;
        const { error } = await supabase.from('products').insert(cleanPayload);
        if (error) return { error: error.message };
      }
    } else {
      const cleanPayload = { ...item.payload };
      const { error } = await supabase.from(table).upsert(cleanPayload);
      if (error) return { error: error.message };
    }

    await removeFromTrashStorage(item);
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Error al restaurar el elemento' };
  }
}

export async function removeFromTrashStorage(item: TrashItemRecord): Promise<void> {
  if (item.source === 'db') {
    await supabase.from('trash_items').delete().eq('id', item.id);
  } else if (item.source === 'local') {
    const current = getLocalTrash(item.business_id);
    setLocalTrash(
      item.business_id,
      current.filter((i) => i.id !== item.id)
    );
  } else if (item.source === 'inactive_product') {
    // No se puede borrar físicamente si tiene ventas, pero lo quitamos de vista si aplica
    await supabase.from('products').delete().eq('id', item.item_id);
  }
}

export async function emptyTrash(businessId: string): Promise<void> {
  setLocalTrash(businessId, []);
  try {
    await supabase.from('trash_items').delete().eq('business_id', businessId);
  } catch {
    // ignore
  }
}
