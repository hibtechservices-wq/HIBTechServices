import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  Receipt,
  FileText,
  Users,
  Menu,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cart,
    metrics,
    isMobileNavOpen,
    setIsMobileNavOpen,
  } = useApp();

  const cartItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  const navItems = [
    {
      id: 'pos',
      label: 'Caisse',
      icon: Store,
      badge: cartItemsCount > 0 ? `${cartItemsCount}` : null,
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
    },
    {
      id: 'caisse',
      label: 'Session',
      icon: Receipt,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'invoices',
      label: 'Factures',
      icon: FileText,
      badge: metrics.unpaidInvoicesCount > 0 ? `${metrics.unpaidInvoicesCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-1px_3px_rgba(15,23,42,0.04)] px-2 pb-[env(safe-area-inset-bottom,0.5rem)] pt-1"
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isMobileNavOpen;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileNavOpen(false);
              }}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-slate-900' : 'text-slate-400'}`} />
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono-nums flex items-center justify-center shadow-xs ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${isActive ? 'font-bold text-slate-900' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" />
              )}
            </button>
          );
        })}

        {/* Menu Button to open Mobile Drawer */}
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${
            isMobileNavOpen
              ? 'text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Tous les modules du menu"
        >
          <div className="relative">
            <Menu className={`w-5 h-5 transition-transform ${isMobileNavOpen ? 'scale-110 text-slate-900' : 'text-slate-400'}`} />
          </div>
          <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${isMobileNavOpen ? 'font-bold text-slate-900' : ''}`}>
            Menu
          </span>
          {isMobileNavOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" />
          )}
        </button>
      </div>
    </nav>
  );
};
