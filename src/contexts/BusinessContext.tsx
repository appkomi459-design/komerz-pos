import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Business, BusinessMember, BusinessRole, BusinessSettings, Branch, Subscription } from '@/types';

export interface CreateBusinessInput {
  name: string;
  business_type: any;
  country: string;
  city?: string;
  address?: string;
  phone?: string;
  currency: string;
  timezone: string;
  logo_url?: string | null;
  cover_url?: string | null;
}

interface BusinessContextType {
  businesses: Business[];
  memberships: BusinessMember[];
  activeBusiness: Business | null;
  activeMembership: BusinessMember | null;
  currentRole: BusinessRole | null;
  settings: BusinessSettings | null;
  mainBranch: Branch | null;
  subscription: Subscription | null;
  loading: boolean;
  setActiveBusinessId: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
  createBusiness: (data: CreateBusinessInput) => Promise<{ business: Business | null; error: Error | null }>;
  updateActiveBusiness: (updates: Partial<Business>) => Promise<{ error: Error | null }>;
  updateSettings: (updates: Partial<BusinessSettings>) => Promise<{ error: Error | null }>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [memberships, setMemberships] = useState<BusinessMember[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [activeMembership, setActiveMembership] = useState<BusinessMember | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [mainBranch, setMainBranch] = useState<Branch | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusinessDetails = useCallback(async (businessId: string) => {
    try {
      // 1. Obtener ajustes del negocio
      const { data: setts } = await supabase
        .from('business_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (setts) setSettings(setts as BusinessSettings);

      // 2. Obtener sucursal principal
      const { data: branches } = await supabase
        .from('branches')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_main', true)
        .maybeSingle();

      if (branches) setMainBranch(branches as Branch);

      // 3. Obtener suscripción y plan
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('business_id', businessId)
        .maybeSingle();

      if (sub) setSubscription(sub as Subscription);
    } catch (err) {
      console.error('Error fetching business details:', err);
    }
  }, []);

  const loadBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setMemberships([]);
      setActiveBusiness(null);
      setActiveMembership(null);
      setSettings(null);
      setMainBranch(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Obtener membresías activas del usuario con los datos del negocio
      const { data: members, error } = await supabase
        .from('business_members')
        .select('*, business:businesses(*)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching business memberships:', error);
        setLoading(false);
        return;
      }

      const validMembers = (members || []) as (BusinessMember & { business: Business })[];
      setMemberships(validMembers);

      const bList = validMembers
        .map((m) => m.business)
        .filter((b): b is Business => Boolean(b));

      setBusinesses(bList);

      if (bList.length > 0) {
        // Revisar si hay un negocio guardado en localStorage
        const storedId = localStorage.getItem('active_business_id');
        const found = bList.find((b) => b.id === storedId);
        const selected = found || bList[0];

        setActiveBusiness(selected);
        const activeM = validMembers.find((m) => m.business_id === selected.id) || null;
        setActiveMembership(activeM);
        localStorage.setItem('active_business_id', selected.id);

        await fetchBusinessDetails(selected.id);
      } else {
        setActiveBusiness(null);
        setActiveMembership(null);
        localStorage.removeItem('active_business_id');
      }
    } catch (err) {
      console.error('Error loading businesses:', err);
    } finally {
      setLoading(false);
    }
  }, [user, fetchBusinessDetails]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const setActiveBusinessId = async (id: string) => {
    const selected = businesses.find((b) => b.id === id);
    if (selected) {
      setActiveBusiness(selected);
      const activeM = memberships.find((m) => m.business_id === selected.id) || null;
      setActiveMembership(activeM);
      localStorage.setItem('active_business_id', selected.id);
      await fetchBusinessDetails(selected.id);
    }
  };

  const createBusiness = async (input: CreateBusinessInput) => {
    if (!user) return { business: null, error: new Error('Usuario no autenticado') };

    try {
      setLoading(true);

      // 1. Crear el negocio
      const { data: newBusiness, error: bError } = await supabase
        .from('businesses')
        .insert({
          name: input.name,
          business_type: input.business_type,
          country: input.country,
          city: input.city || null,
          address: input.address || null,
          phone: input.phone || null,
          currency: input.currency,
          timezone: input.timezone,
          logo_url: input.logo_url || null,
          cover_url: input.cover_url || null,
          status: 'active',
          owner_id: user.id,
        })
        .select()
        .single();

      if (bError || !newBusiness) {
        throw bError || new Error('No se pudo crear el negocio');
      }

      const business = newBusiness as Business;

      // 2. Asignar rol de propietario en business_members
      const { error: mError } = await supabase.from('business_members').insert({
        business_id: business.id,
        user_id: user.id,
        role: 'owner',
        is_active: true,
      });

      if (mError) throw mError;

      // 3. Crear ajustes por defecto
      await supabase.from('business_settings').insert({
        business_id: business.id,
        receipt_footer: `¡Gracias por preferir a ${business.name}!`,
        tax_percentage: input.country === 'DO' ? 18.00 : 16.00,
        invoice_prefix: 'FAC-',
      });

      // 4. Crear sucursal principal
      await supabase.from('branches').insert({
        business_id: business.id,
        name: 'Sucursal Principal',
        address: input.address || 'Oficina Central',
        phone: input.phone || null,
        is_main: true,
        is_active: true,
      });

      // 5. Asignar plan gratuito inicial (trial / free)
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('code', 'free')
        .maybeSingle();

      if (freePlan) {
        await supabase.from('subscriptions').insert({
          business_id: business.id,
          plan_id: freePlan.id,
          status: 'trialing',
        });
      }

      // 6. Registrar en auditoría
      await supabase.from('audit_logs').insert({
        business_id: business.id,
        user_id: user.id,
        action: 'CREATE_BUSINESS',
        entity: 'businesses',
        details: { business_name: business.name, currency: business.currency },
      });

      // Recargar negocios
      await loadBusinesses();
      setActiveBusiness(business);
      localStorage.setItem('active_business_id', business.id);

      return { business, error: null };
    } catch (err: any) {
      console.error('Error creating business:', err);
      return { business: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateActiveBusiness = async (updates: Partial<Business>) => {
    if (!activeBusiness) return { error: new Error('No hay negocio activo') };
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeBusiness.id);

      if (!error) {
        setActiveBusiness((prev) => (prev ? { ...prev, ...updates } : null));
        setBusinesses((prev) =>
          prev.map((b) => (b.id === activeBusiness.id ? { ...b, ...updates } : b))
        );
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateSettings = async (updates: Partial<BusinessSettings>) => {
    if (!activeBusiness || !settings) return { error: new Error('Configuración no disponible') };
    try {
      const { error } = await supabase
        .from('business_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', activeBusiness.id);

      if (!error) {
        setSettings((prev) => (prev ? { ...prev, ...updates } : null));
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const currentRole = activeMembership?.role || null;

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        memberships,
        activeBusiness,
        activeMembership,
        currentRole,
        settings,
        mainBranch,
        subscription,
        loading,
        setActiveBusinessId,
        refreshBusinesses: loadBusinesses,
        createBusiness,
        updateActiveBusiness,
        updateSettings,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness debe ser usado dentro de un BusinessProvider');
  }
  return context;
}
