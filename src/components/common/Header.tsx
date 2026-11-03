import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RateChangerModal } from './RateChangerModal';
import { AuditTrailModal } from '../audit/AuditTrailModal';
import {
  RefreshCw,
  AlertTriangle,
  Lock,
  Wifi,
  WifiOff,
  ShieldAlert,
  LogOut,
  Menu,
} from 'lucide-react';
import { getRoleBadgeInfo } from '../../data/initialUsers';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export const Header: React.FC = () => {
  const {
    settings,
    selectedCurrency,
    setSelectedCurrency,
    activeTab,
    setActiveTab,
    metrics,
    currentUser,
    setIsUserSwitchModalOpen,
    lockSession,
    logout,
    isMobileNavOpen,
    setIsMobileNavOpen,
  } = useApp();

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const rate = settings.exchangeRateUSD_CDF || 2850;
  const roleBadge = getRoleBadgeInfo(currentUser.role);
  const userInitials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <>
      <header className="no-print h-14 sm:h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        {/* Left: Mobile Hamburger & Brand title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Hamburger button */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
            title="Ouvrir le menu principal"
            aria-label="Menu principal"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>

          <div
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2.5 cursor-pointer select-none group min-w-0"
            title="Aller à la Caisse Express (POS)"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs sm:text-sm tracking-wider shadow-sm shrink-0 group-hover:scale-105 transition-transform border border-slate-800">
              <span>{settings.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'CB'}</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 block leading-tight truncate">
                {settings.name}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 font-medium truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{settings.city || 'Lubumbashi'}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 font-mono text-[10px]">RDC</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Offline indicator */}
          {!isOnline && (
            <div
              className="h-8 sm:h-9 inline-flex items-center gap-1.5 px-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold shrink-0 animate-pulse"
              title="Mode déconnecté autonome"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Hors-ligne</span>
            </div>
          )}

          {/* Audit Trail Button (desktop only) */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="hidden xl:inline-flex h-9 items-center justify-center gap-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors shadow-2xs shrink-0"
            title="Consulter le journal d'audit des actions sensibles"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Audit</span>
          </button>

          {/* Low Stock Alert Button */}
          {metrics.lowStockCount > 0 && (
            <button
              onClick={() => setActiveTab('catalog')}
              className="hidden lg:inline-flex h-9 items-center justify-center gap-1.5 text-xs text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 px-2.5 rounded-lg transition-colors font-medium shrink-0 shadow-2xs"
              title="Consulter les articles en alerte stock"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold">{metrics.lowStockCount} alertes</span>
            </button>
          )}

          {/* Live Exchange Rate Button */}
          <button
            onClick={() => setIsRateModalOpen(true)}
            className="h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs transition-colors group shadow-2xs shrink-0 cursor-pointer"
            title="Modifier le taux de change USD / CDF"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="hidden sm:inline text-slate-500 font-medium">1$ =</span>
            <span className="font-bold text-slate-900 font-mono-nums text-[11px] sm:text-xs">
              {rate.toLocaleString('fr-FR')}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">CDF</span>
          </button>

          {/* Currency Display Switcher */}
          <div className="h-8 sm:h-9 inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={`h-full px-2 sm:px-2.5 rounded-md font-semibold transition-all inline-flex items-center justify-center text-[11px] sm:text-xs cursor-pointer ${
                selectedCurrency === 'USD'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              $ USD
            </button>
            <button
              onClick={() => setSelectedCurrency('CDF')}
              className={`h-full px-2 sm:px-2.5 rounded-md font-semibold transition-all inline-flex items-center justify-center text-[11px] sm:text-xs cursor-pointer ${
                selectedCurrency === 'CDF'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              FC CDF
            </button>
          </div>

          {/* User Profile / Switcher button */}
          <button
            onClick={() => setIsUserSwitchModalOpen(true)}
            className="h-8 sm:h-9 inline-flex items-center justify-center gap-1.5 px-2 sm:px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title={`Session active : ${currentUser.name} (${roleBadge.label}) - Cliquez pour changer`}
          >
            <div className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">
              {userInitials}
            </div>
            <span className="hidden lg:inline text-slate-900 max-w-[85px] truncate font-medium">
              {currentUser.name.split(' ')[0]}
            </span>
            <span className="hidden xl:inline text-[10px] font-mono text-slate-500">
              · {roleBadge.label}
            </span>
          </button>

          {/* Lock Screen Button */}
          <button
            onClick={lockSession}
            className="hidden sm:inline-flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Verrouiller l'écran (Code PIN requis)"
            aria-label="Verrouiller l'écran"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          {/* Déconnexion Button */}
          <button
            onClick={logout}
            className="hidden lg:inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 px-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-slate-600 hover:text-rose-700 transition-colors shadow-2xs shrink-0 text-xs font-semibold cursor-pointer"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sortir</span>
          </button>
        </div>
      </header>

      {/* Rate Changer Modal */}
      <RateChangerModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
      />

      {/* Audit Trail Modal */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </>
  );
};
