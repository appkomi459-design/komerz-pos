import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { KomerzLogo } from '@/components/common/KomerzLogo';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070a09] text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
          <KomerzLogo size="sm" />
        </div>

        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-10 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Política de Privacidad
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Komerz POS · Última actualización: Noviembre 2026
              </p>
            </div>
          </div>

          <div className="space-y-5 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-black text-white">1. Información que recopilamos</h2>
              <p>
                Al registrarte y utilizar <strong>Komerz POS</strong> (en web o aplicación móvil), recopilamos únicamente los datos necesarios para operar tu punto de venta:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Datos de cuenta: nombre, correo electrónico y foto de perfil (si inicias sesión con Google).</li>
                <li>Datos de tu negocio: nombre comercial, sucursales, productos, inventario, ventas, clientes, proveedores y vendedores que registres dentro de tu espacio de trabajo.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-black text-white">2. Uso de la información</h2>
              <p>
                Utilizamos tu información exclusivamente para brindarte el servicio de Punto de Venta en la nube, sincronizar tus datos entre dispositivos (web y app móvil), gestionar los límites de tu plan y ofrecerte soporte técnico cuando lo solicites. No vendemos ni alquilamos tus datos a terceros.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-black text-white">3. Permisos del dispositivo (Cámara)</h2>
              <p>
                La aplicación puede solicitar acceso a la cámara de tu dispositivo únicamente cuando utilices el <strong>escáner de códigos de barras</strong> o códigos QR para agilizar tus ventas e inventario. No grabamos ni almacenamos video ni imágenes de tu cámara.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-black text-white">4. Seguridad y almacenamiento</h2>
              <p>
                Todos tus datos se transmiten de forma cifrada mediante HTTPS/TLS y se almacenan en infraestructura segura en la nube con aislamiento por empresa.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-black text-white">5. Eliminación de cuenta y datos</h2>
              <p>
                Puedes solicitar la eliminación total de tu cuenta y de los datos asociados a tu negocio en cualquier momento escribiéndonos a través de nuestro soporte oficial o por WhatsApp al <strong>+591 78652447</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
