import React from 'react';
import { LucideIcon, Sparkles, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PreparedModuleViewProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  moduleCode: string;
}

export const PreparedModuleView: React.FC<PreparedModuleViewProps> = ({
  title,
  description,
  icon: Icon,
  features,
  moduleCode,
}) => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
              {title}
            </h1>
            <Badge variant="blue" size="sm">
              Estructura Preparada
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>

      <Card className="p-8 text-center border-dashed border-2">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200/50 dark:border-emerald-800/40 shadow-sm">
          <Icon className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-2">
          Módulo de {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-lg mx-auto mb-6">
          La arquitectura de base de datos multi-tenant y los permisos de este módulo están activos y protegidos. Las operaciones interactivas avanzadas de esta sección se conectarán en la siguiente fase.
        </p>

        <div className="max-w-md mx-auto bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-left border border-gray-100 dark:border-zinc-800 mb-6">
          <p className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Capacidades del Módulo</span>
          </p>
          <ul className="space-y-2">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Seguridad RLS Activa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Listo para Fase II</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
