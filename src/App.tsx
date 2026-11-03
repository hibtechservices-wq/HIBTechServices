/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { PosView } from './components/pos/PosView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { ClientsView } from './components/clients/ClientsView';
import { CatalogView } from './components/catalog/CatalogView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { SettingsView } from './components/settings/SettingsView';
import { DgiComplianceView } from './components/dgi/DgiComplianceView';
import { UsersView } from './components/users/UsersView';
import { EquipmentsView } from './components/equipments/EquipmentsView';
import { CashRegisterView } from './components/caisse/CashRegisterView';
import { InvoiceCreateModal } from './components/invoices/InvoiceCreateModal';
import { InvoicePrintModal } from './components/invoices/InvoicePrintModal';
import { WhatsAppReminderModal } from './components/whatsapp/WhatsAppReminderModal';
import { UserSwitchModal } from './components/users/UserSwitchModal';
import { LockScreen } from './components/auth/LockScreen';
import { DataWipeModal } from './components/settings/DataWipeModal';
import { ClientPortalView } from './components/portal/ClientPortalView';
import { AccountingView } from './components/accounting/AccountingView';

const MainLayout: React.FC = () => {
  const { activeTab, isSessionLocked, notification, clearNotification } = useApp();
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  // 1. Le Portail Client est le premier à être accessible directement (sans code PIN caisse)
  if (activeTab === 'portal') {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900">
        <main className="flex-1 p-3 sm:p-5 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full no-print">
          <ClientPortalView />
        </main>
        <InvoicePrintModal />
        <WhatsAppReminderModal />
        {/* Global Notification Toast */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-neutral-700 flex items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-400 animate-pulse' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-400'}`} />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={clearNotification}
              className="text-neutral-400 hover:text-white p-1 rounded transition-colors text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Si l'utilisateur bascule vers l'espace caisse / gestion interne et que la session est verrouillée
  if (isSessionLocked) {
    return <LockScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'pos':
        return <PosView />;
      case 'portal':
        return <ClientPortalView />;
      case 'caisse':
        return <CashRegisterView onOpenCreateInvoiceModal={() => setIsNewInvoiceModalOpen(true)} />;
      case 'invoices':
        return <InvoicesView onOpenCreateModal={() => setIsNewInvoiceModalOpen(true)} />;
      case 'dgi':
        return <DgiComplianceView />;
      case 'accounting':
        return <AccountingView />;
      case 'clients':
        return <ClientsView />;
      case 'catalog':
        return <CatalogView />;
      case 'equipments':
        return <EquipmentsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <PosView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden no-print">
        {/* Responsive Desktop Sidebar & Mobile Off-canvas Drawer */}
        <Sidebar />

        {/* Content Viewport */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 overflow-y-auto max-w-7xl mx-auto w-full pb-24 lg:pb-8 no-print">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <div className="no-print">
        <MobileBottomNav />
      </div>

      {/* Global Modals */}
      <InvoiceCreateModal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
      />

      <InvoicePrintModal />

      <WhatsAppReminderModal />

      <UserSwitchModal />

      <DataWipeModal />

      {/* Global Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-400 animate-pulse' : notification.type === 'error' ? 'bg-rose-500' : 'bg-blue-400'}`} />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={clearNotification}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
