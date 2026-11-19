import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'es' | 'en' | 'pt' | 'fr' | 'it' | 'de';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  countryCode: string; // for flagcdn
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'es', name: 'Español', nativeName: 'Español', countryCode: 'es' },
  { code: 'en', name: 'Inglés', nativeName: 'English', countryCode: 'us' },
  { code: 'pt', name: 'Portugués', nativeName: 'Português', countryCode: 'br' },
  { code: 'fr', name: 'Francés', nativeName: 'Français', countryCode: 'fr' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', countryCode: 'it' },
  { code: 'de', name: 'Alemán', nativeName: 'Deutsch', countryCode: 'de' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  es: {
    // Secciones navegación
    'nav.operations': 'OPERACIONES',
    'nav.management': 'GESTIÓN & CONTROL',
    'nav.admin': 'ADMINISTRACIÓN',
    'nav.pos_section': 'PUNTO DE VENTA',

    // Items menú
    'nav.panel': 'Panel',
    'nav.pos': 'Venta (Caja)',
    'nav.seller_panel': 'Mi Panel de Vendedor',
    'nav.stock_check': 'Consultar Stock',
    'nav.products': 'Productos / Stock',
    'nav.categories': 'Categorías',
    'nav.sales': 'Todas las ventas',
    'nav.customers': 'Clientes',
    'nav.customer_sales': 'Ventas a Clientes',
    'nav.suppliers': 'Proveedores',
    'nav.purchases': 'Compras',
    'nav.cash': 'Caja',
    'nav.expenses': 'Gastos',
    'nav.reports': 'Reportes',
    'nav.employees': 'Vendedores',
    'nav.seller_reports': 'Reporte Vendedores',
    'nav.branches': 'Sucursales',
    'nav.settings': 'Configuración',
    'nav.subscription': 'Suscripción',
    'nav.suggestions': 'Sugerencias',
    'nav.logout': 'Cerrar Sesión',

    // Roles
    'role.owner': 'Propietario',
    'role.admin': 'Administrador',
    'role.manager': 'Gerente',
    'role.cashier': 'Vendedor / Cajero',
    'role.seller': 'Vendedor',

    // Configuración
    'settings.title': 'Configuración del Negocio',
    'settings.subtitle': 'Gestiona la información comercial, monedas, idioma e identidad visual de tu empresa.',
    'settings.commercial_info': 'Información Comercial',
    'settings.commercial_desc': 'Datos principales del establecimiento',
    'settings.name': 'Nombre Comercial',
    'settings.business_type': 'Giro o Rubro Comercial',
    'settings.country': 'País',
    'settings.city': 'Ciudad',
    'settings.address': 'Dirección',
    'settings.phone': 'Teléfono / Contacto',
    'settings.currency': 'Moneda',
    'settings.language': 'Idioma del Sistema',
    'settings.timezone': 'Zona Horaria',
    'settings.billing_title': 'Facturación y Recibos',
    'settings.billing_desc': 'Parámetros fiscales y encabezados de comprobantes de venta',
    'settings.tax_id': 'RNC / CIF / RFC / NIT',
    'settings.tax_percent': 'Impuesto (%) ITBIS / IVA',
    'settings.invoice_prefix': 'Prefijo de Factura',
    'settings.receipt_footer': 'Mensaje al Pie del Recibo / Ticket',
    'settings.save_changes': 'Guardar Cambios',
    'settings.saving': 'Guardando...',
    'settings.success': 'Configuración guardada correctamente.',

    // General
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.search': 'Buscar...',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    'common.actions': 'Acciones',
    'common.total': 'Total',
  },
  en: {
    'nav.operations': 'OPERATIONS',
    'nav.management': 'MANAGEMENT & CONTROL',
    'nav.admin': 'ADMINISTRATION',
    'nav.pos_section': 'POINT OF SALE',

    'nav.panel': 'Dashboard',
    'nav.pos': 'POS (Cashier)',
    'nav.seller_panel': 'My Seller Dashboard',
    'nav.stock_check': 'Check Stock',
    'nav.products': 'Products / Inventory',
    'nav.categories': 'Categories',
    'nav.sales': 'All Sales',
    'nav.customers': 'Customers',
    'nav.customer_sales': 'Customer Sales',
    'nav.suppliers': 'Suppliers',
    'nav.purchases': 'Purchases',
    'nav.cash': 'Cash Register',
    'nav.expenses': 'Expenses',
    'nav.reports': 'Reports',
    'nav.employees': 'Sellers',
    'nav.seller_reports': 'Seller Reports',
    'nav.branches': 'Branches',
    'nav.settings': 'Settings',
    'nav.subscription': 'Subscription',
    'nav.suggestions': 'Suggestions',
    'nav.logout': 'Sign Out',

    'role.owner': 'Owner',
    'role.admin': 'Administrator',
    'role.manager': 'Manager',
    'role.cashier': 'Cashier / Seller',
    'role.seller': 'Seller',

    'settings.title': 'Business Settings',
    'settings.subtitle': 'Manage business information, currency, language, and brand identity.',
    'settings.commercial_info': 'Commercial Information',
    'settings.commercial_desc': 'Main establishment details',
    'settings.name': 'Business Name',
    'settings.business_type': 'Business Line / Type',
    'settings.country': 'Country',
    'settings.city': 'City',
    'settings.address': 'Address',
    'settings.phone': 'Phone / Contact',
    'settings.currency': 'Currency',
    'settings.language': 'System Language',
    'settings.timezone': 'Timezone',
    'settings.billing_title': 'Invoicing & Receipts',
    'settings.billing_desc': 'Tax parameters and sales receipt headers',
    'settings.tax_id': 'Tax ID / VAT Number',
    'settings.tax_percent': 'Tax (%) VAT / Sales Tax',
    'settings.invoice_prefix': 'Invoice Prefix',
    'settings.receipt_footer': 'Receipt Footer Message',
    'settings.save_changes': 'Save Changes',
    'settings.saving': 'Saving...',
    'settings.success': 'Settings successfully saved.',

    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search...',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.actions': 'Actions',
    'common.total': 'Total',
  },
  pt: {
    'nav.operations': 'OPERAÇÕES',
    'nav.management': 'GESTÃO & CONTROLE',
    'nav.admin': 'ADMINISTRAÇÃO',
    'nav.pos_section': 'PONTO DE VENDA',

    'nav.panel': 'Painel',
    'nav.pos': 'Ponto de Venda (Caixa)',
    'nav.seller_panel': 'Painel do Vendedor',
    'nav.stock_check': 'Consultar Estoque',
    'nav.products': 'Produtos / Estoque',
    'nav.categories': 'Categorias',
    'nav.sales': 'Todas as Vendas',
    'nav.customers': 'Clientes',
    'nav.customer_sales': 'Vendas a Clientes',
    'nav.suppliers': 'Fornecedores',
    'nav.purchases': 'Compras',
    'nav.cash': 'Caixa',
    'nav.expenses': 'Despesas',
    'nav.reports': 'Relatórios',
    'nav.employees': 'Vendedores',
    'nav.seller_reports': 'Relatório Vendedores',
    'nav.branches': 'Filiais / Unidades',
    'nav.settings': 'Configurações',
    'nav.subscription': 'Assinatura',
    'nav.suggestions': 'Sugestões',
    'nav.logout': 'Sair',

    'role.owner': 'Proprietário',
    'role.admin': 'Administrador',
    'role.manager': 'Gerente',
    'role.cashier': 'Caixa / Vendedor',
    'role.seller': 'Vendedor',

    'settings.title': 'Configurações do Negócio',
    'settings.subtitle': 'Gerencie dados da empresa, moedas, idioma e identidade visual.',
    'settings.commercial_info': 'Informações Comerciais',
    'settings.commercial_desc': 'Dados principais do estabelecimento',
    'settings.name': 'Nome Comercial',
    'settings.business_type': 'Segmento / Ramo Comercial',
    'settings.country': 'País',
    'settings.city': 'Cidade',
    'settings.address': 'Endereço',
    'settings.phone': 'Telefone / Contato',
    'settings.currency': 'Moeda',
    'settings.language': 'Idioma do Sistema',
    'settings.timezone': 'Fuso Horário',
    'settings.billing_title': 'Faturamento e Recibos',
    'settings.billing_desc': 'Parâmetros fiscais e rodapé de cupons',
    'settings.tax_id': 'CNPJ / NIF / CPF',
    'settings.tax_percent': 'Imposto (%) ICMS / IVA',
    'settings.invoice_prefix': 'Prefixo da Fatura',
    'settings.receipt_footer': 'Mensagem no Rodapé do Recibo',
    'settings.save_changes': 'Salvar Alterações',
    'settings.saving': 'Salvando...',
    'settings.success': 'Configurações salvas com sucesso.',

    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.search': 'Pesquisar...',
    'common.active': 'Ativo',
    'common.inactive': 'Inativo',
    'common.actions': 'Ações',
    'common.total': 'Total',
  },
  fr: {
    'nav.operations': 'OPÉRATIONS',
    'nav.management': 'GESTION & CONTRÔLE',
    'nav.admin': 'ADMINISTRATION',
    'nav.pos_section': 'POINT DE VENTE',

    'nav.panel': 'Tableau de bord',
    'nav.pos': 'Caisse (POS)',
    'nav.seller_panel': 'Mon Espace Vendeur',
    'nav.stock_check': 'Consulter le Stock',
    'nav.products': 'Produits / Stock',
    'nav.categories': 'Catégories',
    'nav.sales': 'Toutes les Ventes',
    'nav.customers': 'Clients',
    'nav.customer_sales': 'Ventes aux Clients',
    'nav.suppliers': 'Fournisseurs',
    'nav.purchases': 'Achats',
    'nav.cash': 'Caisse',
    'nav.expenses': 'Dépenses',
    'nav.reports': 'Rapports',
    'nav.employees': 'Vendeurs',
    'nav.seller_reports': 'Rapport Vendeurs',
    'nav.branches': 'Succursales',
    'nav.settings': 'Paramètres',
    'nav.subscription': 'Abonnement',
    'nav.suggestions': 'Suggestions',
    'nav.logout': 'Se déconnecter',

    'role.owner': 'Propriétaire',
    'role.admin': 'Administrateur',
    'role.manager': 'Gérant',
    'role.cashier': 'Caissier / Vendeur',
    'role.seller': 'Vendeur',

    'settings.title': "Paramètres de l'Entreprise",
    'settings.subtitle': 'Gérez les données commerciales, devises, langue et identité visuelle.',
    'settings.commercial_info': 'Informations Commerciales',
    'settings.commercial_desc': "Données principales de l'établissement",
    'settings.name': 'Nom Commercial',
    'settings.business_type': "Secteur d'Activité",
    'settings.country': 'Pays',
    'settings.city': 'Ville',
    'settings.address': 'Adresse',
    'settings.phone': 'Téléphone / Contact',
    'settings.currency': 'Devise',
    'settings.language': 'Langue du Système',
    'settings.timezone': 'Fuseau Horaire',
    'settings.billing_title': 'Facturation et Reçus',
    'settings.billing_desc': 'Paramètres fiscaux et en-tête des tickets de caisse',
    'settings.tax_id': 'Numéro TVA / SIRET',
    'settings.tax_percent': 'Taux de TVA (%)',
    'settings.invoice_prefix': 'Préfixe de Facture',
    'settings.receipt_footer': 'Message en bas du ticket',
    'settings.save_changes': 'Enregistrer les modifications',
    'settings.saving': 'Enregistrement...',
    'settings.success': 'Paramètres enregistrés avec succès.',

    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.search': 'Rechercher...',
    'common.active': 'Actif',
    'common.inactive': 'Inactif',
    'common.actions': 'Actions',
    'common.total': 'Total',
  },
  it: {
    'nav.operations': 'OPERAZIONI',
    'nav.management': 'GESTIONE & CONTROLLO',
    'nav.admin': 'AMMINISTRAZIONE',
    'nav.pos_section': 'PUNTO VENDITA',

    'nav.panel': 'Pannello',
    'nav.pos': 'Cassa (POS)',
    'nav.seller_panel': 'Pannello Venditore',
    'nav.stock_check': 'Controlla Scorte',
    'nav.products': 'Prodotti / Magazzino',
    'nav.categories': 'Categorie',
    'nav.sales': 'Tutte le Vendite',
    'nav.customers': 'Clienti',
    'nav.customer_sales': 'Vendite ai Clienti',
    'nav.suppliers': 'Fornitori',
    'nav.purchases': 'Acquisti',
    'nav.cash': 'Cassa',
    'nav.expenses': 'Spese',
    'nav.reports': 'Report',
    'nav.employees': 'Venditori',
    'nav.seller_reports': 'Report Venditori',
    'nav.branches': 'Filiali',
    'nav.settings': 'Impostazioni',
    'nav.subscription': 'Abbonamento',
    'nav.suggestions': 'Suggerimenti',
    'nav.logout': 'Disconnetti',

    'role.owner': 'Proprietario',
    'role.admin': 'Amministratore',
    'role.manager': 'Manager',
    'role.cashier': 'Cassiere / Venditore',
    'role.seller': 'Venditore',

    'settings.title': "Impostazioni dell'Attività",
    'settings.subtitle': 'Gestisci dati aziendali, valute, lingua e identità visiva.',
    'settings.commercial_info': 'Informazioni Commerciali',
    'settings.commercial_desc': "Dati principali dell'attività",
    'settings.name': 'Nome Commerciale',
    'settings.business_type': 'Settore Commerciale',
    'settings.country': 'Paese',
    'settings.city': 'Città',
    'settings.address': 'Indirizzo',
    'settings.phone': 'Telefono / Contatto',
    'settings.currency': 'Valuta',
    'settings.language': 'Lingua del Sistema',
    'settings.timezone': 'Fuso Orario',
    'settings.billing_title': 'Fatturazione e Scontrini',
    'settings.billing_desc': 'Parametri fiscali e intestazioni degli scontrini',
    'settings.tax_id': 'Partita IVA / Codice Fiscale',
    'settings.tax_percent': 'Aliquota IVA (%)',
    'settings.invoice_prefix': 'Prefisso Fattura',
    'settings.receipt_footer': 'Messaggio a piè di scontrino',
    'settings.save_changes': 'Salva Modifiche',
    'settings.saving': 'Salvataggio...',
    'settings.success': 'Impostazioni salvate con successo.',

    'common.save': 'Salva',
    'common.cancel': 'Annulla',
    'common.edit': 'Modifica',
    'common.delete': 'Elimina',
    'common.search': 'Cerca...',
    'common.active': 'Attivo',
    'common.inactive': 'Inattivo',
    'common.actions': 'Azioni',
    'common.total': 'Totale',
  },
  de: {
    'nav.operations': 'BETRIEB',
    'nav.management': 'VERWALTUNG & KONTROLLE',
    'nav.admin': 'ADMINISTRATION',
    'nav.pos_section': 'KASSE (POS)',

    'nav.panel': 'Dashboard',
    'nav.pos': 'Kasse (POS)',
    'nav.seller_panel': 'Mein Verkäufer-Dashboard',
    'nav.stock_check': 'Bestand Prüfen',
    'nav.products': 'Produkte / Lager',
    'nav.categories': 'Kategorien',
    'nav.sales': 'Alle Verkäufe',
    'nav.customers': 'Kunden',
    'nav.customer_sales': 'Kundenverkäufe',
    'nav.suppliers': 'Lieferanten',
    'nav.purchases': 'Einkäufe',
    'nav.cash': 'Kasse',
    'nav.expenses': 'Ausgaben',
    'nav.reports': 'Berichte',
    'nav.employees': 'Verkäufer',
    'nav.seller_reports': 'Verkäufer-Berichte',
    'nav.branches': 'Filialen',
    'nav.settings': 'Einstellungen',
    'nav.subscription': 'Abonnement',
    'nav.suggestions': 'Vorschläge',
    'nav.logout': 'Abmelden',

    'role.owner': 'Inhaber',
    'role.admin': 'Administrator',
    'role.manager': 'Manager',
    'role.cashier': 'Kassierer / Verkäufer',
    'role.seller': 'Verkäufer',

    'settings.title': 'Unternehmenseinstellungen',
    'settings.subtitle': 'Unternehmensdaten, Währungen, Sprache und Markenidentität verwalten.',
    'settings.commercial_info': 'Geschäftsinformationen',
    'settings.commercial_desc': 'Hauptdaten der Niederlassung',
    'settings.name': 'Firmenname',
    'settings.business_type': 'Branche / Geschäftsfeld',
    'settings.country': 'Land',
    'settings.city': 'Stadt',
    'settings.address': 'Adresse',
    'settings.phone': 'Telefon / Kontakt',
    'settings.currency': 'Währung',
    'settings.language': 'Systemsprache',
    'settings.timezone': 'Zeitzone',
    'settings.billing_title': 'Abrechnung und Belege',
    'settings.billing_desc': 'Steuerparameter und Kassenbon-Kopfzeilen',
    'settings.tax_id': 'Steuernummer / USt-IdNr.',
    'settings.tax_percent': 'Mehrwertsteuer (%) MwSt',
    'settings.invoice_prefix': 'Rechnungspräfix',
    'settings.receipt_footer': 'Fußzeilennachricht auf dem Bon',
    'settings.save_changes': 'Änderungen speichern',
    'settings.saving': 'Speichern...',
    'settings.success': 'Einstellungen erfolgreich gespeichert.',

    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.edit': 'Bearbeiten',
    'common.delete': 'Löschen',
    'common.search': 'Suchen...',
    'common.active': 'Aktiv',
    'common.inactive': 'Inaktiv',
    'common.actions': 'Aktionen',
    'common.total': 'Gesamt',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('komi_pos_language');
    if (saved && (saved === 'es' || saved === 'en' || saved === 'pt' || saved === 'fr' || saved === 'it' || saved === 'de')) {
      return saved as LanguageCode;
    }
    return 'es';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('komi_pos_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const defaultDict = TRANSLATIONS['es'];
    if (defaultDict && defaultDict[key]) {
      return defaultDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe ser usado dentro de LanguageProvider');
  }
  return context;
};
