import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CashRegisterSession, Sale, PaymentMethod, CashBilletageUSD, CashBilletageCDF } from '../../types';
import { formatDate, formatDateTime, formatDualCurrency, getPaymentMethodLabel } from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { exportSyscohadaJournal } from '../../utils/ohadaExport';
import { CashHistoryView } from './CashHistoryView';
import { InvoicesView } from '../invoices/InvoicesView';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  Store,
  DollarSign,
  Receipt,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  Printer,
  Download,
  Eye,
  Lock,
  Unlock,
  ShieldCheck,
  UserCheck,
  Check,
  X,
  Smartphone,
  Building,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
  MessageSquare,
  Calculator,
  Layers,
  Search,
  Filter,
} from 'lucide-react';

interface CashRegisterViewProps {
  onOpenCreateInvoiceModal?: () => void;
  defaultSubTab?: 'TRANSACTIONS' | 'ALL_DOCS' | 'BREAKDOWN' | 'RECONCILIATION' | 'HISTORY';
}

export const CashRegisterView: React.FC<CashRegisterViewProps> = ({
  onOpenCreateInvoiceModal,
  defaultSubTab = 'TRANSACTIONS',
}) => {
  const {
    sales,
    expenses,
    clients,
    settings,
    currentUser,
    users,
    cashSessions,
    currentCashSession,
    openCashSession,
    closeCashSession,
    generateInterimReportX,
    togglePaymentReconciliation,
    setActivePrintSale,
    setActiveWhatsAppClient,
    deleteSale,
  } = useApp();

  const rate = settings.exchangeRateUSD_CDF || 2850;

  // View state
  const [activeSubTab, setActiveSubTab] = useState<'TRANSACTIONS' | 'ALL_DOCS' | 'BREAKDOWN' | 'RECONCILIATION' | 'HISTORY'>(defaultSubTab);
  
  // Modals
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [selectedReportSession, setSelectedReportSession] = useState<CashRegisterSession | null>(null);
  const [reportPrintFormat, setReportPrintFormat] = useState<'A4' | 'THERMAL_80MM'>('A4');
  const [isGeneratingReportPdf, setIsGeneratingReportPdf] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const reportPrintRef = useRef<HTMLDivElement>(null);

  // Reconciliation filter state
  const [reconcileFilterMethod, setReconcileFilterMethod] = useState<string>('ALL');
  const [reconcileSearchRef, setReconcileSearchRef] = useState<string>('');

  // Opening form state
  const [openFloatUSD, setOpenFloatUSD] = useState<number>(50);
  const [openFloatCDF, setOpenFloatCDF] = useState<number>(100000);
  const [openCashierName, setOpenCashierName] = useState<string>(() => {
    const defaultCashier = users.find(u => u.role === 'CASHIER' && u.isActive);
    return defaultCashier?.name || currentUser.name || settings.cashierName || 'Rachel Mwamba (Caisse POS)';
  });
  const [openSupervisorName, setOpenSupervisorName] = useState<string>('Direction Générale');

  // Closing & Billetage form state
  const [useBilletageMode, setUseBilletageMode] = useState<boolean>(true);
  const [closingCountedUSD, setClosingCountedUSD] = useState<number>(0);
  const [closingCountedCDF, setClosingCountedCDF] = useState<number>(0);
  const [billetageUSD, setBilletageUSD] = useState<CashBilletageUSD>({
    b100: 0,
    b50: 0,
    b20: 0,
    b10: 0,
    b5: 0,
    b1: 0,
  });
  const [billetageCDF, setBilletageCDF] = useState<CashBilletageCDF>({
    b20000: 0,
    b10000: 0,
    b5000: 0,
    b1000: 0,
    b500: 0,
  });
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [closingSupervisor, setClosingSupervisor] = useState<string>('Direction Générale');

  // Session sales calculations
  const sessionSales = useMemo(() => {
    if (!currentCashSession) return [];
    return sales.filter((s) => {
      return s.createdAt >= currentCashSession.openedAt && s.type !== 'QUOTE_PROFORMA';
    });
  }, [sales, currentCashSession]);

  // Live financial metrics for active session
  const sessionMetrics = useMemo(() => {
    const totalUSD = sessionSales.reduce((acc, s) => acc + (s.totalUSD || 0), 0);
    const totalCDF = sessionSales.reduce((acc, s) => acc + (s.totalCDF || 0), 0);
    const totalVatUSD = sessionSales.reduce((acc, s) => acc + (s.taxAmountUSD || 0), 0);

    const cashSalesUSD = sessionSales
      .filter((s) => s.paymentMethod === 'CASH_USD')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const cashSalesCDF = sessionSales
      .filter((s) => s.paymentMethod === 'CASH_CDF')
      .reduce((acc, s) => acc + (s.amountPaidUSD * rate || 0), 0);

    const mpesaUSD = sessionSales
      .filter((s) => s.paymentMethod === 'MPESA')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const orangeUSD = sessionSales
      .filter((s) => s.paymentMethod === 'ORANGE_MONEY')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const airtelUSD = sessionSales
      .filter((s) => s.paymentMethod === 'AIRTEL_MONEY')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const afrimoneyUSD = sessionSales
      .filter((s) => s.paymentMethod === 'AFRIMONEY')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const bankUSD = sessionSales
      .filter((s) => s.paymentMethod === 'BANK_TRANSFER')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const mobileTotalUSD = mpesaUSD + orangeUSD + airtelUSD + afrimoneyUSD;
    const mobileTotalCDF = Math.round(mobileTotalUSD * rate);

    const expectedCashUSD = (currentCashSession?.openingFloatUSD || 0) + cashSalesUSD;
    const expectedCashCDF = (currentCashSession?.openingFloatCDF || 0) + cashSalesCDF;

    return {
      totalUSD,
      totalCDF,
      totalVatUSD,
      cashSalesUSD,
      cashSalesCDF,
      mpesaUSD,
      orangeUSD,
      airtelUSD,
      afrimoneyUSD,
      mobileTotalUSD,
      mobileTotalCDF,
      bankUSD,
      expectedCashUSD,
      expectedCashCDF,
      count: sessionSales.length,
    };
  }, [sessionSales, currentCashSession, rate]);

  // Handle Opening Session
  const handleOpenSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openCashSession({
      openingFloatUSD: openFloatUSD,
      openingFloatCDF: openFloatCDF,
      cashierName: openCashierName,
      supervisorName: openSupervisorName,
    });
    setIsOpeningModalOpen(false);
  };

  // Update Billetage USD and recalculate total
  const updateBilletageUSD = (key: keyof CashBilletageUSD, count: number) => {
    const updated = { ...billetageUSD, [key]: Math.max(0, count) };
    setBilletageUSD(updated);
    const sum = updated.b100 * 100 + updated.b50 * 50 + updated.b20 * 20 + updated.b10 * 10 + updated.b5 * 5 + updated.b1 * 1;
    setClosingCountedUSD(sum);
  };

  // Update Billetage CDF and recalculate total
  const updateBilletageCDF = (key: keyof CashBilletageCDF, count: number) => {
    const updated = { ...billetageCDF, [key]: Math.max(0, count) };
    setBilletageCDF(updated);
    const sum = updated.b20000 * 20000 + updated.b10000 * 10000 + updated.b5000 * 5000 + updated.b1000 * 1000 + updated.b500 * 500;
    setClosingCountedCDF(sum);
  };

  // Open Closing Modal with pre-filled theoretical values or billetage
  const handlePrepareClosing = () => {
    if (!currentCashSession) return;
    setClosingCountedUSD(sessionMetrics.expectedCashUSD);
    setClosingCountedCDF(sessionMetrics.expectedCashCDF);
    setClosingNotes('');
    setIsClosingModalOpen(true);
  };

  // Handle Closing Session (Rapport Z)
  const handleCloseSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const closed = closeCashSession({
      countedUSD: Number(closingCountedUSD),
      countedCDF: Number(closingCountedCDF),
      notes: closingNotes,
      supervisorName: closingSupervisor,
      billetageUSD: useBilletageMode ? billetageUSD : undefined,
      billetageCDF: useBilletageMode ? billetageCDF : undefined,
      reportType: 'Z',
    });
    setIsClosingModalOpen(false);
    setSelectedReportSession(closed);
  };

  // Handle Interim Report X (Contrôle sans clôturer)
  const handleOpenInterimReportX = () => {
    const reportX = generateInterimReportX();
    if (reportX) {
      setSelectedReportSession(reportX);
    }
  };

  // Centralized Non-Cash Reconciliation Transactions
  const allReconciliationPayments = useMemo(() => {
    const list: Array<{
      id: string;
      saleId: string;
      saleNumber: string;
      clientName: string;
      clientPhone?: string;
      date: string;
      method: PaymentMethod;
      amountUSD: number;
      amountCDF: number;
      reference?: string;
      isReconciled: boolean;
      reconciledAt?: string;
      reconciledBy?: string;
      notes?: string;
    }> = [];

    sales.forEach(s => {
      (s.paymentHistory || []).forEach(p => {
        if (p.method !== 'CASH_USD' && p.method !== 'CASH_CDF') {
          list.push({
            id: p.id,
            saleId: s.id,
            saleNumber: s.saleNumber,
            clientName: s.clientName,
            clientPhone: s.clientPhone,
            date: p.date,
            method: p.method,
            amountUSD: p.amountUSD,
            amountCDF: p.amountCDF,
            reference: p.reference,
            isReconciled: Boolean(p.isReconciled),
            reconciledAt: p.reconciledAt,
            reconciledBy: p.reconciledBy,
            notes: p.notes,
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  const filteredReconcilePayments = useMemo(() => {
    return allReconciliationPayments.filter(p => {
      const matchMethod = reconcileFilterMethod === 'ALL' || p.method === reconcileFilterMethod;
      const matchSearch = !reconcileSearchRef ||
        (p.reference || '').toLowerCase().includes(reconcileSearchRef.toLowerCase()) ||
        p.clientName.toLowerCase().includes(reconcileSearchRef.toLowerCase()) ||
        p.saleNumber.toLowerCase().includes(reconcileSearchRef.toLowerCase());
      return matchMethod && matchSearch;
    });
  }, [allReconciliationPayments, reconcileFilterMethod, reconcileSearchRef]);

  // Download Z Report as PDF
  const handleDownloadReportPdf = async () => {
    if (!reportPrintRef.current || !selectedReportSession) return;
    setIsGeneratingReportPdf(true);
    try {
      const filename = `Rapport_Z_Caisse_${selectedReportSession.sessionNumber}.pdf`;
      await downloadElementAsPDF(reportPrintRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
      });
    } finally {
      setIsGeneratingReportPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Status Banner */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-5 space-y-4">
        {/* Titre Principal : Gestion de Caisse & Clôture Journalière */}
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Gestion de Caisse & Clôture Journalière
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Supervision des encaissements en direct, contrôle du tiroir-caisse bidevise (USD / CDF) et clôture comptable journalière.
            </p>
          </div>
        </div>

        {/* En dessous : Caisse Ouverte, Export SYSCOHADA, Rapport Z, Clôturer la Caisse & Ventes */}
        <div className="pt-3 border-t border-neutral-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-neutral-50/70 p-3 rounded-xl border border-neutral-200/70">
          {/* Statut Caisse */}
          <div className="flex items-center gap-2.5">
            {currentCashSession ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Session #{currentCashSession.sessionNumber} · Ouverte ({currentCashSession.cashierName})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Caisse Clôturée · Aucune session active</span>
              </div>
            )}
          </div>

          {/* Boutons d'Action : Export SYSCOHADA, Rapport Z, Clôturer la Caisse & Ventes */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Export SYSCOHADA Excel Button */}
            <button
              type="button"
              onClick={() => exportSyscohadaJournal(sales, expenses, settings, rate)}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
              title="Exporter le Journal Comptable Conforme SYSCOHADA (Ventes, Caisse, Balance)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export SYSCOHADA (Excel)</span>
            </button>

            {currentCashSession ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenInterimReportX}
                  className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
                  title="Générer le Rapport X provisoire de mi-journée (sans fermer la caisse)"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Rapport X (Mi-journée)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReportSession(currentCashSession)}
                  className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-800 rounded-lg text-xs font-bold transition-all border border-neutral-300 flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
                  title="Prévisualiser le rapport Z de caisse de la session"
                >
                  <FileText className="w-4 h-4 text-neutral-600" />
                  <span>Rapport Z (En cours)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrepareClosing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Clôturer la Caisse & Ventes</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Autoriser & Ouvrir la Caisse</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Encaissement Session */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Facturé Session</span>
            <Receipt className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-neutral-900">
            ${sessionMetrics.totalUSD.toFixed(2)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-mono">
            {new Intl.NumberFormat('fr-FR').format(sessionMetrics.totalCDF)} FC · {sessionMetrics.count} facture{sessionMetrics.count > 1 ? 's' : ''}
          </p>
        </div>

        {/* Espèces Cash en Tiroir */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Espèces Théoriques</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-emerald-700">
            ${sessionMetrics.expectedCashUSD.toFixed(2)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-mono">
            + {new Intl.NumberFormat('fr-FR').format(sessionMetrics.expectedCashCDF)} FC (Fond + Ventes Cash)
          </p>
        </div>

        {/* Mobile Money Encaissé */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Mobile Money</span>
            <Smartphone className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-amber-600">
            ${sessionMetrics.mobileTotalUSD.toFixed(2)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-mono">
            M-Pesa, Orange & Airtel Money
          </p>
        </div>

        {/* TVA Collectée */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">TVA DGI Collectée</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-blue-700">
            ${sessionMetrics.totalVatUSD.toFixed(2)}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-mono">
            {new Intl.NumberFormat('fr-FR').format(Math.round(sessionMetrics.totalVatUSD * rate))} FC (Taux 16%)
          </p>
        </div>
      </div>

      {/* Main Content Area: Subtabs */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/70 p-2 gap-2 text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0 ${
              activeSubTab === 'TRANSACTIONS'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Ventes de la Session ({sessionSales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ALL_DOCS')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0 ${
              activeSubTab === 'ALL_DOCS'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Toutes les Factures & Devis ({sales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('BREAKDOWN')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0 ${
              activeSubTab === 'BREAKDOWN'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Ventilation Modes de Règlement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('RECONCILIATION')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0 ${
              activeSubTab === 'RECONCILIATION'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Pointage & Rapprochement Mobile Money & Banque ({allReconciliationPayments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('HISTORY')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shrink-0 ${
              activeSubTab === 'HISTORY'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Historique & Mois Précédents ({cashSessions.length})</span>
          </button>
        </div>

        {/* Tab: Toutes les Factures & Devis */}
        {activeSubTab === 'ALL_DOCS' && (
          <div className="p-4 sm:p-6">
            <InvoicesView
              hideHeader={true}
              onOpenCreateModal={onOpenCreateInvoiceModal}
            />
          </div>
        )}

        {/* Tab 1: Transactions de la Session en Cours */}
        {activeSubTab === 'TRANSACTIONS' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-sm text-neutral-900">
                  Ventes et Encaissements Enregistrés Durant la Session
                </h3>
                <p className="text-xs text-neutral-500">
                  Tickets de caisse, factures et règlements enregistrés depuis l'ouverture
                </p>
              </div>
            </div>

            {sessionSales.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-xs">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-neutral-300 stroke-1" />
                <p className="font-medium">Aucune vente enregistrée pour cette session de caisse.</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Utilisez la caisse express (POS) ou créez une facture pour enregistrer des encaissements.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">N° Facture</th>
                      <th className="py-2.5 px-3">Date / Heure</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Règlement</th>
                      <th className="py-2.5 px-3 text-right">Total HT ($)</th>
                      <th className="py-2.5 px-3 text-right">TVA 16% ($)</th>
                      <th className="py-2.5 px-3 text-right">Total TTC ($)</th>
                      <th className="py-2.5 px-3 text-right">Total (CDF)</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-mono-nums">
                    {sessionSales.map((sale) => {
                      const pay = getPaymentMethodLabel(sale.paymentMethod);
                      return (
                        <tr key={sale.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-neutral-900 font-sans flex items-center gap-1.5">
                            <span>{sale.saleNumber}</span>
                            {sale.dgiNfu && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-200">
                                NFU
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-500 font-sans">
                            {formatDateTime(sale.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-medium text-neutral-800">
                            {sale.clientName}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                              {pay.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-600">
                            ${sale.subtotalUSD.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-600">
                            ${sale.taxAmountUSD.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                            ${sale.totalUSD.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-600">
                            {new Intl.NumberFormat('fr-FR').format(sale.totalCDF)} FC
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActivePrintSale(sale)}
                                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded font-semibold text-[11px] font-sans inline-flex items-center gap-1 transition-colors border border-neutral-300"
                                title="Voir ou imprimer la facture normalisée"
                              >
                                <Eye className="w-3 h-3 text-neutral-600" />
                                <span>Facture</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const client = clients.find((c) => c.id === sale.clientId) || {
                                    id: sale.clientId,
                                    name: sale.clientName,
                                    phone: sale.clientPhone,
                                    email: '',
                                    address: '',
                                    city: 'Lubumbashi',
                                    type: 'INDIVIDUAL' as const,
                                    outstandingDebtUSD: 0,
                                    totalSpentUSD: 0,
                                    createdAt: '',
                                  };
                                  setActiveWhatsAppClient({ client, sale });
                                }}
                                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                title="Envoyer la facture par WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSaleToDelete(sale)}
                                className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Supprimer définitivement cette facture"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Ventilation & Modes de Règlement */}
        {activeSubTab === 'BREAKDOWN' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">
                État Détaillé des Encaissements par Mode de Paiement
              </h3>
              <p className="text-xs text-neutral-500">
                Réconciliation financière pour le contrôle du tiroir et des comptes marchands
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Espèces & Tiroir */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Espèces & Tiroir-Caisse Physique</span>
                </div>

                <div className="space-y-2 text-xs font-mono-nums">
                  <div className="flex justify-between text-neutral-600">
                    <span>Fond de caisse initial (USD) :</span>
                    <span className="font-bold text-neutral-900">${currentCashSession?.openingFloatUSD || 0}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Fond de caisse initial (CDF) :</span>
                    <span className="font-bold text-neutral-900">{(currentCashSession?.openingFloatCDF || 0).toLocaleString()} FC</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Ventes Cash (USD) :</span>
                    <span className="font-bold text-emerald-700">+${sessionMetrics.cashSalesUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Ventes Cash (CDF) :</span>
                    <span className="font-bold text-emerald-700">+{new Intl.NumberFormat('fr-FR').format(sessionMetrics.cashSalesCDF)} FC</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-900">
                    <span>Total Espèces Théorique USD :</span>
                    <span className="text-emerald-800">${sessionMetrics.expectedCashUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-neutral-900">
                    <span>Total Espèces Théorique CDF :</span>
                    <span className="text-emerald-800">{new Intl.NumberFormat('fr-FR').format(sessionMetrics.expectedCashCDF)} FC</span>
                  </div>
                </div>
              </div>

              {/* Mobile Money & Comptes Marchands */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>Mobile Money & Comptes Numériques RDC</span>
                </div>

                <div className="space-y-2 text-xs font-mono-nums">
                  <div className="flex justify-between text-neutral-600">
                    <span>Vodacom M-Pesa :</span>
                    <span className="font-bold text-neutral-900">${sessionMetrics.mpesaUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Orange Money :</span>
                    <span className="font-bold text-neutral-900">${sessionMetrics.orangeUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Airtel Money :</span>
                    <span className="font-bold text-neutral-900">${sessionMetrics.airtelUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Virements Bancaires :</span>
                    <span className="font-bold text-neutral-900">${sessionMetrics.bankUSD.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-900">
                    <span>Total Mobile Money & Banques :</span>
                    <span className="text-amber-700">${(sessionMetrics.mobileTotalUSD + sessionMetrics.bankUSD).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Équivalent en Francs :</span>
                    <span>{new Intl.NumberFormat('fr-FR').format((sessionMetrics.mobileTotalUSD + sessionMetrics.bankUSD) * rate)} FC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Pointage & Rapprochement Mobile Money & Banque */}
        {activeSubTab === 'RECONCILIATION' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Top Explanation & KPI Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
              <div>
                <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Journal de Rapprochement & Pointage Mobile Money / Banques</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Vérification unitaire des références de transactions M-Pesa, Orange Money, Airtel Money et virements Rawbank / Equity BCDC.
                </p>
              </div>

              {/* KPI Badges */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Pointé / Rapproché</div>
                  <div className="text-sm font-black font-mono-nums text-emerald-900">
                    ${allReconciliationPayments.filter(p => p.isReconciled).reduce((acc, p) => acc + p.amountUSD, 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    {allReconciliationPayments.filter(p => p.isReconciled).length} transaction(s)
                  </div>
                </div>

                <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">En Attente de Pointage</div>
                  <div className="text-sm font-black font-mono-nums text-amber-900">
                    ${allReconciliationPayments.filter(p => !p.isReconciled).reduce((acc, p) => acc + p.amountUSD, 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-amber-700">
                    {allReconciliationPayments.filter(p => !p.isReconciled).length} transaction(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-neutral-500 shrink-0" />
                <select
                  value={reconcileFilterMethod}
                  onChange={(e) => setReconcileFilterMethod(e.target.value)}
                  className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="ALL">Tous les modes (Mobile Money & Banques)</option>
                  <option value="MPESA">Vodacom M-Pesa</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="AFRIMONEY">Africell Afrimoney</option>
                  <option value="BANK_TRANSFER">Virements Bancaires</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Réf. transaction, n° facture, client..."
                  value={reconcileSearchRef}
                  onChange={(e) => setReconcileSearchRef(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>
            </div>

            {/* Reconciliation Table */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100/80 text-neutral-600 font-bold border-b border-neutral-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3.5">Date & Heure</th>
                      <th className="py-3 px-3.5">N° Facture</th>
                      <th className="py-3 px-3.5">Client</th>
                      <th className="py-3 px-3.5">Opérateur / Moyen</th>
                      <th className="py-3 px-3.5">Réf. Transaction Client</th>
                      <th className="py-3 px-3.5 text-right">Montant (USD / CDF)</th>
                      <th className="py-3 px-3.5 text-center">État Pointage</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70">
                    {filteredReconcilePayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-neutral-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                          <p className="font-semibold text-xs">Aucune transaction trouvée pour ces critères</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReconcilePayments.map((p) => {
                        const isMpesa = p.method === 'MPESA';
                        const isOrange = p.method === 'ORANGE_MONEY';
                        const isAirtel = p.method === 'AIRTEL_MONEY';
                        const isBank = p.method === 'BANK_TRANSFER';

                        return (
                          <tr key={p.id} className={`hover:bg-neutral-50/80 transition-colors ${p.isReconciled ? 'bg-emerald-50/20' : ''}`}>
                            <td className="py-3 px-3.5 whitespace-nowrap font-mono text-neutral-600 text-[11px]">
                              {formatDateTime(p.date)}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap font-bold text-neutral-900">
                              {p.saleNumber}
                            </td>
                            <td className="py-3 px-3.5">
                              <div className="font-semibold text-neutral-900 truncate max-w-[160px]">{p.clientName}</div>
                              {p.clientPhone && <div className="text-[10px] text-neutral-500 font-mono">{p.clientPhone}</div>}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                                isMpesa ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                isOrange ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                isAirtel ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                isBank ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                'bg-purple-100 text-purple-800 border border-purple-300'
                              }`}>
                                <Smartphone className="w-3 h-3" />
                                <span>{getPaymentMethodLabel(p.method).label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {p.reference ? (
                                <span className="font-mono font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300 text-[11px]">
                                  {p.reference}
                                </span>
                              ) : (
                                <span className="text-neutral-400 italic text-[11px]">Non renseignée</span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono-nums">
                              <div className="font-black text-neutral-900">${p.amountUSD.toFixed(2)}</div>
                              <div className="text-[10px] text-neutral-500">{p.amountCDF.toLocaleString()} FC</div>
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap text-center">
                              {p.isReconciled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3" />
                                  <span>Pointé & Rapproché</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3" />
                                  <span>À Rapprocher</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap text-right">
                              <button
                                type="button"
                                onClick={() => togglePaymentReconciliation(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                                  p.isReconciled
                                    ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                }`}
                              >
                                {p.isReconciled ? (
                                  <>
                                    <X className="w-3.5 h-3.5" />
                                    <span>Dépointer</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Valider Pointage</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Historique des Sessions des Mois Précédents & Rapports Z */}
        {activeSubTab === 'HISTORY' && (
          <div className="p-4 sm:p-6 bg-neutral-100/50">
            <CashHistoryView
              onSelectReportSession={(session) => setSelectedReportSession(session)}
            />
          </div>
        )}
      </div>

      {/* ================= MODAL: OUVERTURE & AUTORISATION DE CAISSE ================= */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Autorisation & Ouverture de Caisse</h3>
                  <p className="text-xs text-neutral-500">Initialisation du fond de caisse pour la journée</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenSessionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                    Fond de Caisse ($ USD) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={openFloatUSD}
                      onChange={(e) => setOpenFloatUSD(Number(e.target.value))}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-mono-nums font-bold text-sm text-neutral-900 focus:bg-white"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                    Fond de Caisse (CDF) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={openFloatCDF}
                      onChange={(e) => setOpenFloatCDF(Number(e.target.value))}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-mono-nums font-bold text-sm text-neutral-900 focus:bg-white"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">FC</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sélectionner le Caissier Assigné & Autorisé *</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    {users.length} compte(s) disponible(s)
                  </span>
                </label>
                <div className="space-y-2">
                  <select
                    value={users.some(u => u.name === openCashierName) ? openCashierName : 'AUTRE'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'AUTRE') {
                        setOpenCashierName(val);
                      } else {
                        setOpenCashierName('');
                      }
                    }}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-semibold focus:border-neutral-900 text-xs shadow-2xs"
                    required
                  >
                    <option value="" disabled>-- Cliquez pour choisir le caissier dans la liste --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} — [{u.role === 'CASHIER' ? 'Caissier POS' : u.role === 'SUPER_ADMIN' ? 'Gérant' : u.role === 'MANAGER' ? 'Superviseur' : u.role}] {u.assignedRegister ? `(${u.assignedRegister})` : ''} {!u.isActive ? '(Compte Bloqué)' : ''}
                      </option>
                    ))}
                    <option value="AUTRE">+ Saisir manuellement un autre nom...</option>
                  </select>

                  {/* Saisie manuelle si choix AUTRE ou si le nom n'est pas dans la liste */}
                  {(!users.some(u => u.name === openCashierName) || openCashierName === '') && (
                    <input
                      type="text"
                      value={openCashierName}
                      onChange={(e) => setOpenCashierName(e.target.value)}
                      placeholder="Saisissez le nom et prénom du caissier..."
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-semibold focus:bg-white text-xs"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Autorisé par (Superviseur / Direction) *</span>
                  </span>
                </label>
                <select
                  value={openSupervisorName}
                  onChange={(e) => setOpenSupervisorName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-medium focus:border-neutral-900 text-xs shadow-2xs"
                  required
                >
                  <option value="Direction Générale">Direction Générale</option>
                  {users
                    .filter((u) => u.isActive && (u.role === 'SUPER_ADMIN' || u.role === 'MANAGER'))
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role === 'SUPER_ADMIN' ? 'Gérant Principal' : 'Superviseur Commercial'})
                      </option>
                    ))}
                  <option value="Superviseur Caisse">Superviseur Caisse</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  L'ouverture de caisse verrouille le fond initial et horodate l'autorisation. Toutes les ventes de la journée y seront rattachées.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpeningModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Autoriser & Ouvrir la Caisse</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLÔTURE DE CAISSE & COMPTAGE ================= */}
      {isClosingModalOpen && currentCashSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Clôture de Caisse & Arrêt des Ventes</h3>
                  <p className="text-xs text-neutral-500">Session {currentCashSession.sessionNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseSessionSubmit} className="space-y-4 text-xs">
              {/* Theoretical vs Counted Cash */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Espèces Théoriques USD attendues :</span>
                  <span className="font-bold font-mono text-neutral-900">${sessionMetrics.expectedCashUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Espèces Théoriques CDF attendues :</span>
                  <span className="font-bold font-mono text-neutral-900">{sessionMetrics.expectedCashCDF.toLocaleString()} FC</span>
                </div>
              </div>

              {/* Toggle Billetage Mode vs Direct Input */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-xs">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span>Comptage Physique des Coupures (Billetage)</span>
                </div>
                <div className="flex bg-neutral-200 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setUseBilletageMode(true)}
                    className={`px-2 py-1 rounded-md transition-all ${
                      useBilletageMode ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600'
                    }`}
                  >
                    Billetage Détaillé
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseBilletageMode(false)}
                    className={`px-2 py-1 rounded-md transition-all ${
                      !useBilletageMode ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600'
                    }`}
                  >
                    Saisie Directe
                  </button>
                </div>
              </div>

              {useBilletageMode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Billetage CDF */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between text-neutral-700 font-bold border-b border-neutral-200 pb-1.5 text-[11px]">
                        <span>Billets CDF (Franc Congolais)</span>
                        <span className="font-mono text-emerald-800 font-black">{closingCountedCDF.toLocaleString()} FC</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-20">20 000 FC</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageCDF.b20000 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageCDF('b20000', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-20 text-right">
                            {((billetageCDF.b20000 || 0) * 20000).toLocaleString()} FC
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-20">10 000 FC</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageCDF.b10000 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageCDF('b10000', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-20 text-right">
                            {((billetageCDF.b10000 || 0) * 10000).toLocaleString()} FC
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-20">5 000 FC</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageCDF.b5000 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageCDF('b5000', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-20 text-right">
                            {((billetageCDF.b5000 || 0) * 5000).toLocaleString()} FC
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-20">1 000 FC</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageCDF.b1000 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageCDF('b1000', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-20 text-right">
                            {((billetageCDF.b1000 || 0) * 1000).toLocaleString()} FC
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-20">500 FC</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageCDF.b500 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageCDF('b500', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-20 text-right">
                            {((billetageCDF.b500 || 0) * 500).toLocaleString()} FC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Billetage USD */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between text-neutral-700 font-bold border-b border-neutral-200 pb-1.5 text-[11px]">
                        <span>Billets USD ($ Américain)</span>
                        <span className="font-mono text-emerald-800 font-black">${closingCountedUSD.toFixed(2)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-16">$100</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageUSD.b100 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageUSD('b100', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-16 text-right">
                            ${((billetageUSD.b100 || 0) * 100).toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-16">$50</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageUSD.b50 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageUSD('b50', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-16 text-right">
                            ${((billetageUSD.b50 || 0) * 50).toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-16">$20</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageUSD.b20 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageUSD('b20', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-16 text-right">
                            ${((billetageUSD.b20 || 0) * 20).toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-16">$10</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageUSD.b10 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageUSD('b10', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-16 text-right">
                            ${((billetageUSD.b10 || 0) * 10).toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-16">$5</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageUSD.b5 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageUSD('b5', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-16 text-right">
                            ${((billetageUSD.b5 || 0) * 5).toFixed(0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-neutral-700 w-16">$1</span>
                          <span className="text-neutral-400">×</span>
                          <input
                            type="number"
                            min="0"
                            value={billetageUSD.b1 || ''}
                            placeholder="0"
                            onChange={(e) => updateBilletageUSD('b1', Number(e.target.value))}
                            className="w-20 bg-white border border-neutral-300 rounded px-2 py-1 text-right font-mono font-bold text-xs"
                          />
                          <span className="text-neutral-500 font-mono text-[10px] w-16 text-right">
                            ${((billetageUSD.b1 || 0) * 1).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary of variances */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-nums">
                    <div className="p-2 bg-neutral-100 rounded-lg">
                      <div className="text-[10px] text-neutral-500 uppercase font-sans font-bold">Écart Caisse USD</div>
                      <div>
                        {closingCountedUSD - sessionMetrics.expectedCashUSD === 0 ? (
                          <span className="text-emerald-600 font-bold">✓ Écart nul (Parfait)</span>
                        ) : closingCountedUSD - sessionMetrics.expectedCashUSD > 0 ? (
                          <span className="text-emerald-700 font-bold">Excédent : +${(closingCountedUSD - sessionMetrics.expectedCashUSD).toFixed(2)}</span>
                        ) : (
                          <span className="text-rose-600 font-bold">Déficit : -${Math.abs(closingCountedUSD - sessionMetrics.expectedCashUSD).toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 bg-neutral-100 rounded-lg">
                      <div className="text-[10px] text-neutral-500 uppercase font-sans font-bold">Écart Caisse CDF</div>
                      <div>
                        {closingCountedCDF - sessionMetrics.expectedCashCDF === 0 ? (
                          <span className="text-emerald-600 font-bold">✓ Écart nul</span>
                        ) : closingCountedCDF - sessionMetrics.expectedCashCDF > 0 ? (
                          <span className="text-emerald-700 font-bold">Excédent : +{(closingCountedCDF - sessionMetrics.expectedCashCDF).toLocaleString()} FC</span>
                        ) : (
                          <span className="text-rose-600 font-bold">Déficit : -{Math.abs(closingCountedCDF - sessionMetrics.expectedCashCDF).toLocaleString()} FC</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Physical Cash Count Direct Inputs */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                      Espèces Réelles Comptées ($ USD) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={closingCountedUSD}
                      onChange={(e) => setClosingCountedUSD(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-mono-nums font-bold text-sm text-neutral-900"
                      required
                    />
                    <div className="mt-1 text-[11px] font-mono-nums">
                      {closingCountedUSD - sessionMetrics.expectedCashUSD === 0 ? (
                        <span className="text-emerald-600 font-bold">✓ Écart nul (Parfait)</span>
                      ) : closingCountedUSD - sessionMetrics.expectedCashUSD > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          Excédent : +${(closingCountedUSD - sessionMetrics.expectedCashUSD).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold">
                          Déficit : -${Math.abs(closingCountedUSD - sessionMetrics.expectedCashUSD).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                      Espèces Réelles Comptées (CDF) *
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={closingCountedCDF}
                      onChange={(e) => setClosingCountedCDF(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 font-mono-nums font-bold text-sm text-neutral-900"
                      required
                    />
                    <div className="mt-1 text-[11px] font-mono-nums">
                      {closingCountedCDF - sessionMetrics.expectedCashCDF === 0 ? (
                        <span className="text-emerald-600 font-bold">✓ Écart nul</span>
                      ) : closingCountedCDF - sessionMetrics.expectedCashCDF > 0 ? (
                        <span className="text-emerald-700 font-bold">
                          Excédent : +{(closingCountedCDF - sessionMetrics.expectedCashCDF).toLocaleString()} FC
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold">
                          Déficit : -{Math.abs(closingCountedCDF - sessionMetrics.expectedCashCDF).toLocaleString()} FC
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                  Visa & Validation Superviseur *
                </label>
                <input
                  type="text"
                  value={closingSupervisor}
                  onChange={(e) => setClosingSupervisor(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 font-semibold focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                  Observations & Justifications d'Écarts
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Ex: Clôture sans incident. Billets vérifiés au détecteur UV."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>Clôturer Définitivement & Générer Rapport Z</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RAPPORT JOURNALIER DE CAISSE (RAPPORT Z & X) ================= */}
      {selectedReportSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden my-auto">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">
                  {selectedReportSession.reportType === 'X' ? 'Rapport X Provisoire (Mi-journée)' : 'Rapport Z Journalier'} · {selectedReportSession.sessionNumber}
                </span>
              </div>

              {/* Format Toggle A4 vs 80mm Thermal */}
              <div className="flex bg-neutral-800 p-0.5 rounded-lg text-xs font-bold border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setReportPrintFormat('A4')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    reportPrintFormat === 'A4' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  📄 Bordereau A4
                </button>
                <button
                  type="button"
                  onClick={() => setReportPrintFormat('THERMAL_80MM')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    reportPrintFormat === 'THERMAL_80MM' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  🧾 Ticket 80mm
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReportPdf}
                  disabled={isGeneratingReportPdf}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingReportPdf ? 'Création PDF...' : 'Télécharger PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReportSession(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Area */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-neutral-100 flex justify-center">
              {reportPrintFormat === 'THERMAL_80MM' ? (
                /* Ticket Thermique 80mm */
                <div
                  ref={reportPrintRef}
                  className="bg-white p-4 w-[340px] shadow-md border border-dashed border-neutral-400 rounded text-neutral-900 text-xs font-mono leading-tight space-y-3"
                >
                  {/* Header */}
                  <div className="text-center space-y-1 pb-2 border-b border-dashed border-neutral-400">
                    <h2 className="text-base font-black uppercase">{settings.name}</h2>
                    <p className="text-[10px]">{settings.activityDescription}</p>
                    <p className="text-[10px]">{settings.address}, {settings.city}</p>
                    <p className="text-[10px]">Tél: {settings.phone1}</p>
                    <p className="text-[9px]">NIF: {settings.nif} | RCCM: {settings.rccm}</p>
                    <div className="pt-1.5">
                      <span className="inline-block px-2 py-0.5 bg-neutral-900 text-white font-black text-[11px] uppercase tracking-wider">
                        {selectedReportSession.reportType === 'X' ? 'RAPPORT X DE MI-JOURNÉE' : 'CLÔTURE JOURNALIÈRE RAPPORT Z'}
                      </span>
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-neutral-400">
                    <div className="flex justify-between">
                      <span>N° Session :</span>
                      <span className="font-bold">{selectedReportSession.sessionNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ouverture :</span>
                      <span>{formatDateTime(selectedReportSession.openedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Arrêt / Clôture :</span>
                      <span>{selectedReportSession.closedAt ? formatDateTime(selectedReportSession.closedAt) : 'En cours'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Caissier :</span>
                      <span className="font-bold">{selectedReportSession.cashierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux du jour :</span>
                      <span>1$ = {rate} FC</span>
                    </div>
                  </div>

                  {/* Sales & Fiscal Totals */}
                  <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-neutral-400">
                    <div className="flex justify-between font-bold">
                      <span>NB TRANSACTIONS :</span>
                      <span>{selectedReportSession.totalTransactionsCount || sessionMetrics.count}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm">
                      <span>TOTAL VENTES USD :</span>
                      <span>${(selectedReportSession.totalSalesUSD || sessionMetrics.totalUSD).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>TOTAL VENTES CDF :</span>
                      <span>{new Intl.NumberFormat('fr-FR').format(selectedReportSession.totalSalesCDF || sessionMetrics.totalCDF)} FC</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>TVA 16% COLLECTÉE :</span>
                      <span>${(selectedReportSession.vatCollectedUSD || sessionMetrics.totalVatUSD).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payments Breakdown */}
                  <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-neutral-400">
                    <div className="font-bold uppercase text-[10px]">RÈGLEMENTS :</div>
                    <div className="flex justify-between">
                      <span>- Espèces USD :</span>
                      <span>${(selectedReportSession.cashSalesUSD || sessionMetrics.cashSalesUSD).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- Espèces CDF :</span>
                      <span>{new Intl.NumberFormat('fr-FR').format(selectedReportSession.cashSalesCDF || sessionMetrics.cashSalesCDF)} FC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- Mobile Money :</span>
                      <span>${(selectedReportSession.mobileMoneyUSD || sessionMetrics.mobileTotalUSD).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- Banque / Virement :</span>
                      <span>${(selectedReportSession.bankSalesUSD || sessionMetrics.bankUSD).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Cash In Drawer & Count */}
                  <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-neutral-400">
                    <div className="font-bold uppercase text-[10px]">CONTRÔLE TIROIR-CAISSE :</div>
                    <div className="flex justify-between">
                      <span>Fond Initial USD :</span>
                      <span>${selectedReportSession.openingFloatUSD}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fond Initial CDF :</span>
                      <span>{selectedReportSession.openingFloatCDF.toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-dotted border-neutral-300">
                      <span>Attendu USD :</span>
                      <span>${(selectedReportSession.expectedCashInDrawerUSD || sessionMetrics.expectedCashUSD).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Attendu CDF :</span>
                      <span>{new Intl.NumberFormat('fr-FR').format(selectedReportSession.expectedCashInDrawerCDF || sessionMetrics.expectedCashCDF)} FC</span>
                    </div>
                    <div className="flex justify-between font-black text-neutral-900 pt-1 border-t border-dotted border-neutral-300">
                      <span>Réel Compté USD :</span>
                      <span>${(selectedReportSession.closingCountedUSD || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-neutral-900">
                      <span>Réel Compté CDF :</span>
                      <span>{new Intl.NumberFormat('fr-FR').format(selectedReportSession.closingCountedCDF || 0)} FC</span>
                    </div>
                    <div className="flex justify-between font-black pt-1 border-t border-neutral-400">
                      <span>ÉCART CAISSE :</span>
                      <span>
                        {(selectedReportSession.differenceUSD || 0) >= 0 ? `+$${(selectedReportSession.differenceUSD || 0).toFixed(2)}` : `-$${Math.abs(selectedReportSession.differenceUSD || 0).toFixed(2)}`}
                        {' / '}
                        {(selectedReportSession.differenceCDF || 0) >= 0 ? `+${(selectedReportSession.differenceCDF || 0).toLocaleString()} FC` : `-${Math.abs(selectedReportSession.differenceCDF || 0).toLocaleString()} FC`}
                      </span>
                    </div>
                  </div>

                  {/* Billetage summary on ticket if present */}
                  {selectedReportSession.billetageCDF && (
                    <div className="space-y-0.5 text-[9px] pb-2 border-b border-dashed border-neutral-400">
                      <div className="font-bold uppercase">BILLETAGE PHYSIQUE :</div>
                      <div className="flex justify-between">
                        <span>CDF (20k/10k/5k/1k/500) :</span>
                        <span>{selectedReportSession.billetageCDF.b20000} / {selectedReportSession.billetageCDF.b10000} / {selectedReportSession.billetageCDF.b5000} / {selectedReportSession.billetageCDF.b1000} / {selectedReportSession.billetageCDF.b500}</span>
                      </div>
                      {selectedReportSession.billetageUSD && (
                        <div className="flex justify-between">
                          <span>USD (100/50/20/10/5/1) :</span>
                          <span>{selectedReportSession.billetageUSD.b100} / {selectedReportSession.billetageUSD.b50} / {selectedReportSession.billetageUSD.b20} / {selectedReportSession.billetageUSD.b10} / {selectedReportSession.billetageUSD.b5} / {selectedReportSession.billetageUSD.b1}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="pt-2 text-center text-[10px] space-y-4">
                    <p>Signature Caissier : ___________________</p>
                    <p>Visa Superviseur : ___________________</p>
                    <p className="text-[9px] text-neutral-500 pt-1">*** FIN DU TICKET DE CLÔTURE ***</p>
                  </div>
                </div>
              ) : (
                /* Bordereau A4 Complet */
                <div
                  ref={reportPrintRef}
                  className="bg-white p-8 w-[640px] shadow-md border border-neutral-300 rounded text-neutral-900 text-xs font-sans leading-normal"
                >
                  {/* Header */}
                  <div className="text-center pb-4 border-b-2 border-neutral-900 space-y-1">
                    <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                      {settings.name}
                    </h2>
                    <p className="text-[11px] text-neutral-600">{settings.address}, {settings.city} · Tél: {settings.phone1}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      NIF: {settings.nif} | RCCM: {settings.rccm} | ID.NAT: {settings.idNat}
                    </p>
                    <div className="inline-block mt-2 px-3 py-1 bg-neutral-900 text-white font-bold text-xs uppercase tracking-widest rounded">
                      {selectedReportSession.reportType === 'X' ? 'RAPPORT PROVISOIRE DE CAISSE (RAPPORT X)' : 'RAPPORT JOURNALIER DE CLÔTURE DE CAISSE (RAPPORT Z)'}
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-200 text-xs font-mono-nums">
                    <div className="space-y-1">
                      <p><span className="text-neutral-500 font-sans">N° Session :</span> <strong className="text-neutral-900">{selectedReportSession.sessionNumber}</strong></p>
                      <p><span className="text-neutral-500 font-sans">Ouverte le :</span> {formatDateTime(selectedReportSession.openedAt)}</p>
                      <p><span className="text-neutral-500 font-sans">Clôturée le :</span> {selectedReportSession.closedAt ? formatDateTime(selectedReportSession.closedAt) : 'En cours'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p><span className="text-neutral-500 font-sans">Caissier :</span> <strong>{selectedReportSession.cashierName}</strong></p>
                      <p><span className="text-neutral-500 font-sans">Superviseur :</span> {selectedReportSession.supervisorName || 'Direction'}</p>
                      <p><span className="text-neutral-500 font-sans">Taux du jour :</span> 1$ = {rate} FC</p>
                    </div>
                  </div>

                  {/* Chiffre d'Affaires & TVA */}
                  <div className="py-4 border-b border-neutral-200 space-y-2">
                    <h4 className="font-bold uppercase text-[10px] text-neutral-800 tracking-wider">
                      1. Récapitulatif Fiscal des Ventes
                    </h4>
                    <div className="space-y-1 font-mono-nums text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Nombre de Transactions / Factures :</span>
                        <span className="font-bold">{selectedReportSession.totalTransactionsCount || sessionMetrics.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Total Ventes ($ USD) :</span>
                        <span className="font-bold text-sm text-neutral-900">${(selectedReportSession.totalSalesUSD || sessionMetrics.totalUSD).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Total Ventes (CDF) :</span>
                        <span className="font-bold">{new Intl.NumberFormat('fr-FR').format(selectedReportSession.totalSalesCDF || sessionMetrics.totalCDF)} FC</span>
                      </div>
                      <div className="flex justify-between text-blue-700">
                        <span>TVA 16% DGI Collectée :</span>
                        <span className="font-bold">${(selectedReportSession.vatCollectedUSD || sessionMetrics.totalVatUSD).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ventilation des Encaissements */}
                  <div className="py-4 border-b border-neutral-200 space-y-2">
                    <h4 className="font-bold uppercase text-[10px] text-neutral-800 tracking-wider">
                      2. Ventilation par Mode de Règlement
                    </h4>
                    <div className="space-y-1.5 font-mono-nums text-xs">
                      <div className="flex justify-between">
                        <span>Espèces Cash USD :</span>
                        <span className="font-semibold">${(selectedReportSession.cashSalesUSD || sessionMetrics.cashSalesUSD).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Espèces Cash CDF :</span>
                        <span className="font-semibold">{new Intl.NumberFormat('fr-FR').format(selectedReportSession.cashSalesCDF || sessionMetrics.cashSalesCDF)} FC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile Money (M-Pesa, Orange, Airtel, Afri) :</span>
                        <span className="font-semibold">${(selectedReportSession.mobileMoneyUSD || sessionMetrics.mobileTotalUSD).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Banques / Virements (Rawbank, Equity BCDC) :</span>
                        <span className="font-semibold">${(selectedReportSession.bankSalesUSD || sessionMetrics.bankUSD).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* État du Tiroir-Caisse & Écarts */}
                  <div className="py-4 border-b border-neutral-200 space-y-2">
                    <h4 className="font-bold uppercase text-[10px] text-neutral-800 tracking-wider">
                      3. Contrôle du Tiroir-Caisse & Billetage
                    </h4>
                    <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1.5 font-mono-nums text-xs">
                      <div className="flex justify-between text-neutral-600">
                        <span>Fond de caisse initial :</span>
                        <span>${selectedReportSession.openingFloatUSD} + {selectedReportSession.openingFloatCDF.toLocaleString()} FC</span>
                      </div>
                      <div className="flex justify-between font-bold text-neutral-900 border-t border-neutral-200 pt-1">
                        <span>Espèces Théoriques Attendues :</span>
                        <span>${(selectedReportSession.expectedCashInDrawerUSD || sessionMetrics.expectedCashUSD).toFixed(2)} + {new Intl.NumberFormat('fr-FR').format(selectedReportSession.expectedCashInDrawerCDF || sessionMetrics.expectedCashCDF)} FC</span>
                      </div>
                      <div className="flex justify-between font-bold text-neutral-900">
                        <span>Espèces Réelles Comptées :</span>
                        <span>${(selectedReportSession.closingCountedUSD || 0).toFixed(2)} + {new Intl.NumberFormat('fr-FR').format(selectedReportSession.closingCountedCDF || 0)} FC</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-neutral-300">
                        <span>Écart de Caisse :</span>
                        <span>
                          {(selectedReportSession.differenceUSD || 0) >= 0 ? (
                            <span className="text-emerald-700">+${(selectedReportSession.differenceUSD || 0).toFixed(2)}</span>
                          ) : (
                            <span className="text-rose-600">-${Math.abs(selectedReportSession.differenceUSD || 0).toFixed(2)}</span>
                          )}
                          {' · '}
                          {(selectedReportSession.differenceCDF || 0) >= 0 ? (
                            <span className="text-emerald-700">+{(selectedReportSession.differenceCDF || 0).toLocaleString()} FC</span>
                          ) : (
                            <span className="text-rose-600">-{(selectedReportSession.differenceCDF || 0).toLocaleString()} FC</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Billetage Table if available */}
                    {selectedReportSession.billetageCDF && (
                      <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] font-mono-nums bg-neutral-50 p-3 rounded border border-neutral-200">
                        <div>
                          <div className="font-bold text-neutral-800 text-[10px] uppercase font-sans mb-1">Billetage Francs Congolais (CDF)</div>
                          <div className="space-y-0.5 text-neutral-600">
                            <div>20 000 FC × {selectedReportSession.billetageCDF.b20000 || 0} = {((selectedReportSession.billetageCDF.b20000 || 0) * 20000).toLocaleString()} FC</div>
                            <div>10 000 FC × {selectedReportSession.billetageCDF.b10000 || 0} = {((selectedReportSession.billetageCDF.b10000 || 0) * 10000).toLocaleString()} FC</div>
                            <div>5 000 FC × {selectedReportSession.billetageCDF.b5000 || 0} = {((selectedReportSession.billetageCDF.b5000 || 0) * 5000).toLocaleString()} FC</div>
                            <div>1 000 FC × {selectedReportSession.billetageCDF.b1000 || 0} = {((selectedReportSession.billetageCDF.b1000 || 0) * 1000).toLocaleString()} FC</div>
                            <div>500 FC × {selectedReportSession.billetageCDF.b500 || 0} = {((selectedReportSession.billetageCDF.b500 || 0) * 500).toLocaleString()} FC</div>
                          </div>
                        </div>

                        {selectedReportSession.billetageUSD && (
                          <div>
                            <div className="font-bold text-neutral-800 text-[10px] uppercase font-sans mb-1">Billetage Dollars Américains (USD)</div>
                            <div className="space-y-0.5 text-neutral-600">
                              <div>$100 × {selectedReportSession.billetageUSD.b100 || 0} = ${((selectedReportSession.billetageUSD.b100 || 0) * 100).toFixed(0)}</div>
                              <div>$50 × {selectedReportSession.billetageUSD.b50 || 0} = ${((selectedReportSession.billetageUSD.b50 || 0) * 50).toFixed(0)}</div>
                              <div>$20 × {selectedReportSession.billetageUSD.b20 || 0} = ${((selectedReportSession.billetageUSD.b20 || 0) * 20).toFixed(0)}</div>
                              <div>$10 × {selectedReportSession.billetageUSD.b10 || 0} = ${((selectedReportSession.billetageUSD.b10 || 0) * 10).toFixed(0)}</div>
                              <div>$5 × {selectedReportSession.billetageUSD.b5 || 0} = ${((selectedReportSession.billetageUSD.b5 || 0) * 5).toFixed(0)}</div>
                              <div>$1 × {selectedReportSession.billetageUSD.b1 || 0} = ${((selectedReportSession.billetageUSD.b1 || 0) * 1).toFixed(0)}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Signatures & Mentions */}
                  <div className="pt-6 grid grid-cols-2 text-center text-xs text-neutral-600">
                    <div className="space-y-10">
                      <p className="font-semibold text-neutral-800">Le Caissier</p>
                      <p className="text-[10px] text-neutral-400">Date & Signature</p>
                    </div>
                    <div className="space-y-10">
                      <p className="font-semibold text-neutral-800">Le Superviseur / Direction</p>
                      <p className="text-[10px] text-neutral-400">Visa & Cachet</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal for Session Sales */}
      <ConfirmDeleteModal
        isOpen={Boolean(saleToDelete)}
        title="Supprimer la facture / le ticket de caisse ?"
        message={`Êtes-vous certain de vouloir supprimer définitivement ${saleToDelete?.saleNumber} (${saleToDelete?.clientName}) ? Cette opération réajustera automatiquement les stocks des articles et les totaux de la caisse.`}
        details={saleToDelete ? `Montant total: $${saleToDelete.totalUSD.toFixed(2)} USD (${saleToDelete.totalCDF.toLocaleString('fr-FR')} FC)` : ''}
        confirmText="Supprimer définitivement"
        onConfirm={() => {
          if (saleToDelete) {
            deleteSale(saleToDelete.id);
            setSaleToDelete(null);
          }
        }}
        onCancel={() => setSaleToDelete(null)}
      />
    </div>
  );
};
