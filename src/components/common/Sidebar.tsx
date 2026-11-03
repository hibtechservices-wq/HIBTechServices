import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  FileText,
  Users,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Database,
  UserCheck,
  KeyRound,
  LogOut,
  Radio,
  CreditCard,
  X,
  Trash2,
  Globe,
  BookOpen,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    metrics,
    settings,
    exportDatabaseJSON,
    users,
    equipments,
    subscriptions,
    setIsUserSwitchModalOpen,
    logout,
    currentCashSession,
    isMobileNavOpen,
    setIsMobileNavOpen,
    setIsDataWipeModalOpen,
  } = useApp();

  const subAlertCount = (subscriptions || []).filter((s) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(s.nextBillingDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return s.status === 'OVERDUE' || diff <= 7;
  }).length;

  const navigationSections = [
    {
      title: 'Commerce & Caisse',
      items: [
        {
          id: 'pos',
          label: 'Caisse Express (POS)',
          icon: Store,
          badge: null,
        },
        {
          id: 'caisse',
          label: 'Session & Clôture (Z/X)',
          icon: Receipt,
          badge: currentCashSession ? 'Ouverte' : (metrics.unpaidInvoicesCount > 0 ? `${metrics.unpaidInvoicesCount} imp.` : null),
          badgeType: currentCashSession ? 'success' : 'neutral',
        },
        {
          id: 'invoices',
          label: 'Factures & Devis',
          icon: FileText,
          badge: metrics.unpaidInvoicesCount > 0 ? `${metrics.unpaidInvoicesCount}` : null,
          badgeType: 'warning',
        },
      ],
    },
    {
      title: 'Opérations & Terrains',
      items: [
        {
          id: 'equipments',
          label: 'Starlink & Réseaux',
          icon: Radio,
          badge: subAlertCount > 0 ? `${subAlertCount} alerte` : (equipments.length > 0 ? `${equipments.length}` : null),
          badgeType: subAlertCount > 0 ? 'danger' : 'neutral',
        },
        {
          id: 'clients',
          label: 'Clients & Créances',
          icon: Users,
          badge: metrics.totalDebtsUSD > 0 ? `$${Math.round(metrics.totalDebtsUSD)}` : null,
          badgeType: metrics.totalDebtsUSD > 0 ? 'danger' : 'neutral',
        },
        {
          id: 'catalog',
          label: 'Catalogue & Stocks',
          icon: Package,
          badge: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} alerte` : null,
          badgeType: metrics.lowStockCount > 0 ? 'warning' : 'neutral',
        },
      ],
    },
    {
      title: 'Finances & Contrôle',
      items: [
        {
          id: 'dgi',
          label: 'Conformité DGI & TVA',
          icon: ShieldCheck,
          badge: 'DEF RDC',
          badgeType: 'success',
        },
        {
          id: 'accounting',
          label: 'Comptabilité (SYSCOHADA)',
          icon: BookOpen,
          badge: 'OHADA',
          badgeType: 'indigo',
        },
        {
          id: 'expenses',
          label: 'Dépenses & Trésorerie',
          icon: CreditCard,
          badge: null,
        },
        {
          id: 'users',
          label: 'Utilisateurs & Droits',
          icon: UserCheck,
          badge: `${users.length}`,
          badgeType: 'neutral',
        },
        {
          id: 'settings',
          label: 'Paramètres du Système',
          icon: Settings,
          badge: null,
        },
      ],
    },
    {
      title: 'Espace B2B',
      items: [
        {
          id: 'portal',
          label: 'Portail Client B2B',
          icon: Globe,
          badge: 'En ligne',
          badgeType: 'success',
        },
      ],
    },
  ];

  const getBadgeClass = (type?: string, isActive = false) => {
    if (isActive) return 'text-amber-300 font-mono text-[11px]';
    switch (type) {
      case 'danger':
        return 'text-rose-600 font-mono font-medium text-[11px]';
      case 'warning':
        return 'text-amber-600 font-mono font-medium text-[11px]';
      case 'success':
        return 'text-emerald-600 font-mono font-semibold text-[11px]';
      case 'indigo':
        return 'text-indigo-600 font-mono font-semibold text-[11px]';
      default:
        return 'text-slate-400 font-mono text-[11px]';
    }
  };

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Navigation List */}
      <div className="p-3 space-y-5">
        {navigationSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{section.title}</span>
              {isMobile && sIdx === 0 && (
                <span className="text-[11px] text-emerald-600 font-semibold">{settings.name}</span>
              )}
            </div>

            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (isMobile) setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left min-h-[38px] cursor-pointer group ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-amber-400'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`shrink-0 ml-1.5 ${getBadgeClass(item.badgeType, isActive)}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        {/* DGI Fiscal Certification Box */}
        <div className="pt-1 px-3">
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-900 font-semibold">Norme DGI RDC</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold tracking-tight">DEF ACTIF</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-tight">
              Facturation certifiée · QR Code & Sceau DGI conforme.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        {/* PWA Install / Download Button */}
        <PWAInstallButton variant="sidebar" />

        <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-medium">
          <span className="truncate max-w-[120px]">NIF: {settings.nif || 'A2109845B'}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsUserSwitchModalOpen(true);
                if (isMobile) setIsMobileNavOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Changer d'utilisateur / Code PIN"
              aria-label="Changer d'utilisateur"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                logout();
                if (isMobile) setIsMobileNavOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsDataWipeModalOpen(true);
                if (isMobile) setIsMobileNavOpen(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Réinitialiser les données"
              aria-label="Réinitialiser les données"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={exportDatabaseJSON}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Sauvegarde JSON de la base"
              aria-label="Sauvegarde JSON"
            >
              <Database className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="no-print hidden lg:flex w-64 border-r border-slate-200/80 bg-white flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Off-Canvas Sliding Drawer */}
      {isMobileNavOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs border border-slate-700">
                  <span>CB</span>
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                    {settings.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {settings.city || 'Lubumbashi'} · RDC
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav content */}
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              {renderNavContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
