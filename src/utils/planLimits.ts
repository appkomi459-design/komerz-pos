import type { Subscription } from '@/types';

export interface PlanLimits {
  planCode: 'free' | 'pro' | 'enterprise';
  planName: string;
  maxBranches: number;
  maxSellers: number;
  maxProducts: number;
  nextPlanName: string | null;
  nextPlanPrice: string | null;
}

export function getPlanLimits(subscription: Subscription | null): PlanLimits {
  const code = (subscription?.plan?.code || 'free') as 'free' | 'pro' | 'enterprise';

  if (code === 'pro') {
    return {
      planCode: 'pro',
      planName: 'Profesional',
      maxBranches: 3,
      maxSellers: 5,
      maxProducts: 250,
      nextPlanName: 'Empresarial',
      nextPlanPrice: '$75/mes',
    };
  }

  if (code === 'enterprise') {
    return {
      planCode: 'enterprise',
      planName: 'Empresarial',
      maxBranches: 10,
      maxSellers: 20,
      maxProducts: 600,
      nextPlanName: null,
      nextPlanPrice: null,
    };
  }

  return {
    planCode: 'free',
    planName: 'Gratis / Prueba',
    maxBranches: 1,
    maxSellers: 2,
    maxProducts: 100,
    nextPlanName: 'Profesional',
    nextPlanPrice: '$25/mes',
  };
}
