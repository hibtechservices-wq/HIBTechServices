import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  generateAllAccountingEntries,
  buildGeneralLedger,
  buildTrialBalance,
  calculateAccountingFinancialSummary,
  AccountLedgerSummary,
} from '../../utils/syscohadaLedger';
import { syscohadaChartOfAccounts } from '../../data/syscohadaChart';
import { SyscohadaJournalCode } from '../../types';
import { exportSyscohadaJournal } from '../../utils/ohadaExport';
import { AccountingEntryModal } from './AccountingEntryModal';
import {
  BookOpen,
  FileSpreadsheet,
  Printer,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  TrendingUp,
  Layers,
  ListChecks,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Building2,
  FileText,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';

type AccountingTab =
  | 'JOURNALS'
  | 'LEDGER'
  | 'TRIAL_BALANCE'
  | 'INCOME_STATEMENT'
  | 'CHART_OF_ACCOUNTS';

export const AccountingView: React.FC = () => {
  const {
    sales,
    expenses,
    settings,
    customAccountingEntries,
    deleteAccountingEntry,
    hasPermission,
  } = useApp();

  const rate = settings.exchangeRateUSD_CDF || 2850;
  const canManageAccounting =
    hasPermission('canAccessAccounting') ||
    hasPermission('canAccessDGI') ||
    hasPermission('canManageSettings');

  // Active Tab
  const [activeSubTab, setActiveSubTab] = useState<AccountingTab>('JOURNALS');

  // Modal State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  // Journal Filter State
  const [selectedJournal, setSelectedJournal] = useState<SyscohadaJournalCode | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | 'ALL'>('ALL');

  // Grand Livre Selected Account
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('ALL');

  // Chart of accounts search & class filter
  const [chartSearch, setChartSearch] = useState('');
  const [chartClassFilter, setChartClassFilter] = useState<number | 'ALL'>('ALL');

  // Compute all accounting entries
  const allEntries = useMemo(() => {
    return generateAllAccountingEntries(sales, expenses, customAccountingEntries || [], rate);
  }, [sales, expenses, customAccountingEntries, rate]);

  // Compute Grand Livre
  const generalLedger = useMemo(() => {
    return buildGeneralLedger(allEntries);
  }, [allEntries]);

  // Compute Trial Balance (Balance 6 colonnes)
  const trialBalance = useMemo(() => {
    return buildTrialBalance(generalLedger);
  }, [generalLedger]);

  // Compute Financial Summary & Equality
  const financialSummary = useMemo(() => {
    return calculateAccountingFinancialSummary(allEntries, generalLedger, rate);
  }, [allEntries, generalLedger, rate]);

  // Filtered Journals entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (selectedJournal !== 'ALL' && entry.journal !== selectedJournal) return false;
      if (selectedClassFilter !== 'ALL') {
        const accClass = parseInt(entry.accountNumber.charAt(0), 10);
        if (accClass !== selectedClassFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPiece = entry.pieceRef.toLowerCase().includes(q);
        const matchesAccount = entry.accountNumber.toLowerCase().includes(q);
        const matchesLabel = entry.accountLabel.toLowerCase().includes(q);
        const matchesDesc = entry.description.toLowerCase().includes(q);
        return matchesPiece || matchesAccount || matchesLabel || matchesDesc;
      }
      return true;
    });
  }, [allEntries, selectedJournal, selectedClassFilter, searchQuery]);

  // Totals for filtered entries
  const filteredTotals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, curr) => {
        acc.debitUSD += curr.debitUSD;
        acc.creditUSD += curr.creditUSD;
        acc.debitCDF += curr.debitCDF;
        acc.creditCDF += curr.creditCDF;
        return acc;
      },
      { debitUSD: 0, creditUSD: 0, debitCDF: 0, creditCDF: 0 }
    );
  }, [filteredEntries]);

  // Trial Balance Totals
  const trialBalanceTotals = useMemo(() => {
    return trialBalance.reduce(
      (acc, r) => {
        acc.mvtDebitUSD += r.totalDebitUSD;
        acc.mvtCreditUSD += r.totalCreditUSD;
        acc.soldeDebitUSD += r.debitBalanceUSD;
        acc.soldeCreditUSD += r.creditBalanceUSD;
        acc.mvtDebitCDF += r.totalDebitCDF;
        acc.mvtCreditCDF += r.totalCreditCDF;
        acc.soldeDebitCDF += r.debitBalanceCDF;
        acc.soldeCreditCDF += r.creditBalanceCDF;
        return acc;
      },
      {
        mvtDebitUSD: 0,
        mvtCreditUSD: 0,
        soldeDebitUSD: 0,
        soldeCreditUSD: 0,
        mvtDebitCDF: 0,
        mvtCreditCDF: 0,
        soldeDebitCDF: 0,
        soldeCreditCDF: 0,
      }
    );
  }, [trialBalance]);

  // Handle Export Excel
  const handleExportExcel = () => {
    exportSyscohadaJournal(sales, expenses, settings, rate);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  const formatUSD = (val: number) => {
    return val.toLocaleString('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCDF = (val: number) => {
    return Math.round(val).toLocaleString('fr-CD');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Context Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono">
                <Scale className="w-3.5 h-3.5" />
                SYSCOHADA RÉVISÉ · RDC
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Taux BCC : 1 USD = {rate.toLocaleString('fr-FR')} CDF
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Comptabilité Générale & Balance OHADA
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Double-partie continue (Journaux VE, CA, BQ, AC & OD) et états financiers certifiés pour {settings.name}.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canManageAccounting && (
              <button
                onClick={() => setIsEntryModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Écriture (OD)</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Exporter les journaux au format officiel Excel SYSCOHADA"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel SYSCOHADA</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Imprimer les états comptables"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
          {/* KPI 1: Chiffre d'Affaires HT (Classe 7) */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Chiffre d'Affaires HT (Classe 7)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 font-mono-nums tracking-tight">
              ${formatUSD(financialSummary.totalRevenueUSD)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-nums mt-0.5">
              {formatCDF(financialSummary.totalRevenueCDF)} CDF
            </div>
          </div>

          {/* KPI 2: Charges d'Exploitation (Classe 6) */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Charges d'Exploitation (Classe 6)</span>
              <ArrowDownLeft className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900 font-mono-nums tracking-tight">
              ${formatUSD(financialSummary.totalExpensesUSD)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-nums mt-0.5">
              {formatCDF(financialSummary.totalExpensesCDF)} CDF
            </div>
          </div>

          {/* KPI 3: Résultat d'Exploitation Net */}
          <div className="bg-neutral-50 rounded-lg p-3.5 border border-neutral-200">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Résultat d'Exploitation Net</span>
              <ArrowUpRight
                className={`w-4 h-4 ${
                  financialSummary.netOperatingIncomeUSD >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              />
            </div>
            <div
              className={`mt-1.5 text-xl font-bold font-mono tracking-tight tabular-nums ${
                financialSummary.netOperatingIncomeUSD >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              ${formatUSD(financialSummary.netOperatingIncomeUSD)}
            </div>
            <div className="text-[11px] text-neutral-500 font-mono tabular-nums mt-0.5">
              {formatCDF(financialSummary.netOperatingIncomeCDF)} CDF
            </div>
          </div>

          {/* KPI 4: Trésorerie & Équilibre Partie Double */}
          <div className="bg-neutral-50 rounded-lg p-3.5 border border-neutral-200">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span>Trésorerie Disponible (Classe 5)</span>
              {financialSummary.isBalanced ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Équilibré
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Écart
                </span>
              )}
            </div>
            <div className="mt-1.5 text-xl font-bold text-neutral-900 font-mono tracking-tight tabular-nums">
              ${formatUSD(financialSummary.totalTreasuryUSD)}
            </div>
            <div className="text-[11px] text-neutral-500 font-mono tabular-nums mt-0.5">
              {formatCDF(financialSummary.totalTreasuryCDF)} CDF
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('JOURNALS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'JOURNALS'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          Journaux Auxiliaires ({allEntries.length})
        </button>

        <button
          onClick={() => setActiveSubTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'LEDGER'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Grand Livre ({generalLedger.length} comptes)
        </button>

        <button
          onClick={() => setActiveSubTab('TRIAL_BALANCE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'TRIAL_BALANCE'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <Scale className="w-4 h-4" />
          Balance Générale (6 colonnes)
        </button>

        <button
          onClick={() => setActiveSubTab('INCOME_STATEMENT')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'INCOME_STATEMENT'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Compte de Résultat & SIG
        </button>

        <button
          onClick={() => setActiveSubTab('CHART_OF_ACCOUNTS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeSubTab === 'CHART_OF_ACCOUNTS'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Plan Comptable OHADA
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JOURNAUX AUXILIAIRES                                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'JOURNALS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher pièce, compte, libellé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-neutral-500 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Journal :
              </span>
              <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-0.5 text-xs">
                {(['ALL', 'VT', 'CA', 'ACH', 'OD', 'BQ'] as const).map((jCode) => (
                  <button
                    key={jCode}
                    onClick={() => setSelectedJournal(jCode)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      selectedJournal === jCode
                        ? 'bg-white text-indigo-700 font-bold shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {jCode === 'ALL' ? 'Tous' : jCode}
                  </button>
                ))}
              </div>

              {/* Class Filter */}
              <select
                value={selectedClassFilter}
                onChange={(e) =>
                  setSelectedClassFilter(
                    e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10)
                  )
                }
                className="text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Toutes les classes</option>
                <option value="1">Cl. 1 - Ressources durables</option>
                <option value="2">Cl. 2 - Actif immobilisé</option>
                <option value="3">Cl. 3 - Stocks</option>
                <option value="4">Cl. 4 - Tiers (Clients/Fourn.)</option>
                <option value="5">Cl. 5 - Trésorerie</option>
                <option value="6">Cl. 6 - Charges</option>
                <option value="7">Cl. 7 - Produits</option>
              </select>
            </div>
          </div>

          {/* Journal Entries Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-2">Jrn</th>
                    <th className="py-2.5 px-3">N° Pièce</th>
                    <th className="py-2.5 px-3">Compte</th>
                    <th className="py-2.5 px-3">Intitulé SYSCOHADA</th>
                    <th className="py-2.5 px-3">Libellé de l'opération</th>
                    <th className="py-2.5 px-3 text-right">Débit ($)</th>
                    <th className="py-2.5 px-3 text-right">Crédit ($)</th>
                    <th className="py-2.5 px-3 text-right text-neutral-400">Débit (CDF)</th>
                    <th className="py-2.5 px-3 text-right text-neutral-400">Crédit (CDF)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-neutral-400">
                        Aucune écriture comptable ne correspond aux critères sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const isCustom = entry.sourceType === 'MANUAL_OD';
                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-neutral-50 transition-colors font-mono-nums"
                        >
                          <td className="py-2 px-3 text-neutral-600 whitespace-nowrap">
                            {entry.date}
                          </td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                entry.journal === 'VT'
                                  ? 'bg-blue-50 text-blue-700'
                                  : entry.journal === 'CA'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : entry.journal === 'ACH'
                                  ? 'bg-amber-50 text-amber-700'
                                  : entry.journal === 'BQ'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              {entry.journal}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-neutral-900 whitespace-nowrap">
                            {entry.pieceRef}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {entry.accountNumber}
                          </td>
                          <td className="py-2 px-3 text-neutral-800 max-w-xs truncate" title={entry.accountLabel}>
                            {entry.accountLabel}
                          </td>
                          <td className="py-2 px-3 text-neutral-600 max-w-md truncate" title={entry.description}>
                            {entry.description}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-neutral-900 tabular-nums">
                            {entry.debitUSD > 0 ? `$${formatUSD(entry.debitUSD)}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-neutral-900 tabular-nums">
                            {entry.creditUSD > 0 ? `$${formatUSD(entry.creditUSD)}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-neutral-400 tabular-nums">
                            {entry.debitCDF > 0 ? formatCDF(entry.debitCDF) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-neutral-400 tabular-nums">
                            {entry.creditCDF > 0 ? formatCDF(entry.creditCDF) : '-'}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {isCustom && canManageAccounting && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Supprimer cette écriture comptable manuelle ?")) {
                                    deleteAccountingEntry(entry.id);
                                  }
                                }}
                                className="text-neutral-400 hover:text-rose-600 p-1 rounded"
                                title="Supprimer l'écriture manuelle"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Sticky Summary Row */}
                {filteredEntries.length > 0 && (
                  <tfoot>
                    <tr className="bg-neutral-100 font-bold text-neutral-900 border-t-2 border-neutral-300">
                      <td colSpan={6} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                        Totaux Filtre ({filteredEntries.length} lignes) :
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-indigo-900">
                        ${formatUSD(filteredTotals.debitUSD)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-indigo-900">
                        ${formatUSD(filteredTotals.creditUSD)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[11px] text-neutral-600">
                        {formatCDF(filteredTotals.debitCDF)} CDF
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[11px] text-neutral-600">
                        {formatCDF(filteredTotals.creditCDF)} CDF
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GRAND LIVRE GÉNÉRAL                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Account Selector Bar */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs text-neutral-600 font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Compte à consulter :
              </span>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="text-xs border border-neutral-300 rounded-lg px-3 py-1.5 bg-white text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md"
              >
                <option value="ALL">Tous les comptes mouvementés ({generalLedger.length})</option>
                {generalLedger.map((acc) => (
                  <option key={acc.accountNumber} value={acc.accountNumber}>
                    {acc.accountNumber} - {acc.accountLabel} (Solde: ${formatUSD(Math.abs(acc.balanceUSD))} {acc.balanceUSD >= 0 ? 'D' : 'C'})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-neutral-500 font-medium">
              Affichage du solde progressif en devises USD et CDF
            </div>
          </div>

          {/* Ledger Accounts Cards / Tables */}
          <div className="space-y-6">
            {generalLedger
              .filter((acc) =>
                selectedLedgerAccount === 'ALL'
                  ? true
                  : acc.accountNumber === selectedLedgerAccount
              )
              .map((acc) => {
                const isDebitSolde = acc.balanceUSD >= 0;
                return (
                  <div
                    key={acc.accountNumber}
                    className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden"
                  >
                    {/* Account Header */}
                    <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                          {acc.accountNumber}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-neutral-900">{acc.accountLabel}</h3>
                          <span className="text-[10px] text-neutral-500 uppercase">
                            Classe {acc.accountClass} · {acc.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Account Balance Badge */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="text-neutral-500 text-[10px] block">Total Débit</span>
                          <span className="font-mono font-bold text-neutral-900 tabular-nums">
                            ${formatUSD(acc.totalDebitUSD)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-500 text-[10px] block">Total Crédit</span>
                          <span className="font-mono font-bold text-neutral-900 tabular-nums">
                            ${formatUSD(acc.totalCreditUSD)}
                          </span>
                        </div>
                        <div className="text-right pl-3 border-l border-neutral-300">
                          <span className="text-neutral-500 text-[10px] block">
                            Solde {isDebitSolde ? 'Débiteur' : 'Créditeur'}
                          </span>
                          <span
                            className={`font-mono font-bold text-sm tabular-nums ${
                              isDebitSolde ? 'text-indigo-700' : 'text-emerald-700'
                            }`}
                          >
                            ${formatUSD(Math.abs(acc.balanceUSD))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ledger Entries Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-50/50 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px]">
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-2">Jrn</th>
                            <th className="py-2 px-3">Pièce</th>
                            <th className="py-2 px-3">Libellé</th>
                            <th className="py-2 px-3 text-right">Débit ($)</th>
                            <th className="py-2 px-3 text-right">Crédit ($)</th>
                            <th className="py-2 px-3 text-right">Solde Prog. ($)</th>
                            <th className="py-2 px-3 text-right text-neutral-400">Solde Prog. (CDF)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono-nums">
                          {acc.entries.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50">
                              <td className="py-1.5 px-3 text-neutral-600">{item.date}</td>
                              <td className="py-1.5 px-2">
                                <span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1 py-0.5 rounded">
                                  {item.journal}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 font-mono font-medium text-neutral-900">
                                {item.pieceRef}
                              </td>
                              <td className="py-1.5 px-3 text-neutral-700 max-w-sm truncate" title={item.description}>
                                {item.description}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-medium text-neutral-900 tabular-nums">
                                {item.debitUSD > 0 ? `$${formatUSD(item.debitUSD)}` : '-'}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono font-medium text-neutral-900 tabular-nums">
                                {item.creditUSD > 0 ? `$${formatUSD(item.creditUSD)}` : '-'}
                              </td>
                              <td
                                className={`py-1.5 px-3 text-right font-mono font-bold tabular-nums ${
                                  item.runningBalanceUSD >= 0 ? 'text-indigo-700' : 'text-emerald-700'
                                }`}
                              >
                                ${formatUSD(Math.abs(item.runningBalanceUSD))}{' '}
                                <span className="text-[10px] text-neutral-500 font-sans">
                                  {item.runningBalanceUSD >= 0 ? 'D' : 'C'}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-[11px] text-neutral-400 tabular-nums">
                                {formatCDF(Math.abs(item.runningBalanceCDF))} CDF
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BALANCE GÉNÉRALE (6 COLONNES)                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'TRIAL_BALANCE' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-indigo-700" />
              <div>
                <h3 className="text-xs font-bold text-indigo-950">
                  Balance Générale des Comptes à 6 Colonnes (Norme SYSCOHADA)
                </h3>
                <p className="text-[11px] text-indigo-800">
                  Vérification de l'égalité comptable absolue : Total Débits = Total Crédits et Total Soldes Débiteurs = Total Soldes Créditeurs.
                </p>
              </div>
            </div>
            <div className="text-right">
              {Math.abs(trialBalanceTotals.soldeDebitUSD - trialBalanceTotals.soldeCreditUSD) < 0.05 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Balance Équilibrée
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Déséquilibre : $
                  {formatUSD(
                    Math.abs(trialBalanceTotals.soldeDebitUSD - trialBalanceTotals.soldeCreditUSD)
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-200 text-center">
                    <th rowSpan={2} className="py-2 px-3 text-left border-r border-neutral-200">
                      Compte
                    </th>
                    <th rowSpan={2} className="py-2 px-3 text-left border-r border-neutral-200">
                      Intitulé du Compte SYSCOHADA
                    </th>
                    <th colSpan={2} className="py-1 px-3 border-r border-neutral-200 bg-neutral-200/60">
                      MOUVEMENTS DE LA PÉRIODE (USD)
                    </th>
                    <th colSpan={2} className="py-1 px-3 bg-indigo-100/60">
                      SOLDES DE CLÔTURE (USD)
                    </th>
                  </tr>
                  <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                    <th className="py-1.5 px-3 text-right border-r border-neutral-200">Débit ($)</th>
                    <th className="py-1.5 px-3 text-right border-r border-neutral-200">Crédit ($)</th>
                    <th className="py-1.5 px-3 text-right border-r border-neutral-200 text-indigo-900 font-bold">
                      Débiteur ($)
                    </th>
                    <th className="py-1.5 px-3 text-right text-emerald-900 font-bold">
                      Créditeur ($)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono-nums">
                  {trialBalance.map((row) => (
                    <tr key={row.accountNumber} className="hover:bg-neutral-50">
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700 border-r border-neutral-100">
                        {row.accountNumber}
                      </td>
                      <td className="py-2 px-3 text-neutral-800 border-r border-neutral-100">
                        {row.accountLabel}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-neutral-100 tabular-nums">
                        {row.totalDebitUSD > 0 ? `$${formatUSD(row.totalDebitUSD)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-neutral-100 tabular-nums">
                        {row.totalCreditUSD > 0 ? `$${formatUSD(row.totalCreditUSD)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-neutral-100 font-semibold text-indigo-800 tabular-nums">
                        {row.debitBalanceUSD > 0 ? `$${formatUSD(row.debitBalanceUSD)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-800 tabular-nums">
                        {row.creditBalanceUSD > 0 ? `$${formatUSD(row.creditBalanceUSD)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 font-bold text-neutral-900 border-t-2 border-neutral-300">
                    <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-xs border-r border-neutral-200">
                      TOTAUX GÉNÉRAUX DE LA BALANCE :
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-xs border-r border-neutral-200">
                      ${formatUSD(trialBalanceTotals.mvtDebitUSD)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-xs border-r border-neutral-200">
                      ${formatUSD(trialBalanceTotals.mvtCreditUSD)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-indigo-900 border-r border-neutral-200">
                      ${formatUSD(trialBalanceTotals.soldeDebitUSD)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-emerald-900">
                      ${formatUSD(trialBalanceTotals.soldeCreditUSD)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPTE DE RÉSULTAT & SIG                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'INCOME_STATEMENT' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-neutral-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Compte de Résultat & Soldes Intermédiaires de Gestion (SIG)
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Cascade des résultats selon les normes comptables OHADA pour {settings.name}
            </p>

            <div className="space-y-4">
              {/* Ligne 1 : Chiffre d'Affaires */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    1. Chiffre d'Affaires Net (Classes 701 + 706)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Ventes de marchandises et prestations de services facturées
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-neutral-900 tabular-nums">
                    +${formatUSD(financialSummary.totalRevenueUSD)}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    {formatCDF(financialSummary.totalRevenueCDF)} CDF
                  </div>
                </div>
              </div>

              {/* Ligne 2 : Consommations & Charges Externes */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    2. Charges d'Exploitation & Dépenses Décaissées (Classe 6)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Achats consommés, loyers, carburant, télécoms, salaires et charges courantes
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-rose-700 tabular-nums">
                    -${formatUSD(financialSummary.totalExpensesUSD)}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    {formatCDF(financialSummary.totalExpensesCDF)} CDF
                  </div>
                </div>
              </div>

              {/* Ligne 3 : Résultat d'Exploitation Net */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  financialSummary.netOperatingIncomeUSD >= 0
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-rose-50 border-rose-300'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <span>3. Résultat d'Exploitation Net (Bénéfice ou Perte)</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        financialSummary.netOperatingIncomeUSD >= 0
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-rose-200 text-rose-800'
                      }`}
                    >
                      {financialSummary.netOperatingIncomeUSD >= 0
                        ? 'BÉNÉFICE D\'EXPLOITATION'
                        : 'PERTE D\'EXPLOITATION'}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    Marge opérationnelle :{' '}
                    {financialSummary.totalRevenueUSD > 0
                      ? `${(
                          (financialSummary.netOperatingIncomeUSD / financialSummary.totalRevenueUSD) *
                          100
                        ).toFixed(1)}%`
                      : '0%'}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold font-mono tabular-nums ${
                      financialSummary.netOperatingIncomeUSD >= 0
                        ? 'text-emerald-800'
                        : 'text-rose-800'
                    }`}
                  >
                    ${formatUSD(financialSummary.netOperatingIncomeUSD)}
                  </div>
                  <div className="text-xs font-mono text-neutral-600">
                    {formatCDF(financialSummary.netOperatingIncomeCDF)} CDF
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PLAN COMPTABLE GÉNÉRAL SYSCOHADA                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'CHART_OF_ACCOUNTS' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher numéro ou intitulé..."
                value={chartSearch}
                onChange={(e) => setChartSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">Classe :</span>
              <select
                value={chartClassFilter}
                onChange={(e) =>
                  setChartClassFilter(
                    e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10)
                  )
                }
                className="text-xs border border-neutral-300 rounded-lg px-3 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Toutes les classes (1 à 7)</option>
                <option value="1">Classe 1 - Ressources durables</option>
                <option value="2">Classe 2 - Actif immobilisé</option>
                <option value="3">Classe 3 - Stocks</option>
                <option value="4">Classe 4 - Tiers</option>
                <option value="5">Classe 5 - Trésorerie</option>
                <option value="6">Classe 6 - Charges des activités ordinaires</option>
                <option value="7">Classe 7 - Produits des activités ordinaires</option>
              </select>
            </div>
          </div>

          {/* Chart Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                    <th className="py-2.5 px-3">N° Compte</th>
                    <th className="py-2.5 px-3">Classe</th>
                    <th className="py-2.5 px-3">Intitulé SYSCOHADA</th>
                    <th className="py-2.5 px-3">Catégorie</th>
                    <th className="py-2.5 px-3">Description / Utilisation usuelle en RDC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {syscohadaChartOfAccounts
                    .filter((acc) => {
                      if (chartClassFilter !== 'ALL' && acc.accountClass !== chartClassFilter) {
                        return false;
                      }
                      if (chartSearch.trim()) {
                        const q = chartSearch.toLowerCase();
                        return (
                          acc.accountNumber.toLowerCase().includes(q) ||
                          acc.label.toLowerCase().includes(q) ||
                          (acc.description && acc.description.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    })
                    .map((acc) => (
                      <tr key={acc.accountNumber} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                          {acc.accountNumber}
                        </td>
                        <td className="py-2 px-3 text-neutral-500 font-medium">
                          Classe {acc.accountClass}
                        </td>
                        <td className="py-2 px-3 font-semibold text-neutral-900">
                          {acc.label}
                        </td>
                        <td className="py-2 px-3 text-neutral-600">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700">
                            {acc.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-neutral-500 text-[11px]">
                          {acc.description || '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      <AccountingEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
      />
    </div>
  );
};
