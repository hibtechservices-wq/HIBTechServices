import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, SaleStatus, DocumentType } from '../../types';
import {
  formatDate,
  formatDateTime,
  formatDualCurrency,
  getPaymentMethodLabel,
  getStatusBadge,
  getDocumentTypeLabel,
} from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelUtils';
import { exportSyscohadaJournal } from '../../utils/ohadaExport';
import { PaymentRecordModal } from './PaymentRecordModal';
import { InvoiceEditModal } from './InvoiceEditModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { SalesReportModal } from './SalesReportModal';
import {
  Search,
  Plus,
  Printer,
  MessageSquare,
  CreditCard,
  FileCheck,
  Trash2,
  FileSpreadsheet,
  Edit2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

interface InvoicesViewProps {
  onOpenCreateModal?: () => void;
  hideHeader?: boolean;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onOpenCreateModal, hideHeader = false }) => {
  const {
    sales,
    clients,
    expenses,
    settings,
    deleteSale,
    convertQuoteToInvoice,
    setActivePrintSale,
    setActiveWhatsAppClient,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'INVOICE' | 'QUOTE_PROFORMA' | 'UNPAID'>('ALL');
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<Sale | null>(null);
  const [selectedSaleToEdit, setSelectedSaleToEdit] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const rate = settings.exchangeRateUSD_CDF || 2850;

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchSearch =
        sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.clientPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.dgiNfu && sale.dgiNfu.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (selectedTab === 'INVOICE') {
        return sale.type === 'INVOICE' || sale.type === 'RECEIPT';
      }
      if (selectedTab === 'QUOTE_PROFORMA') {
        return sale.type === 'QUOTE_PROFORMA';
      }
      if (selectedTab === 'UNPAID') {
        return (sale.type === 'INVOICE' || sale.type === 'RECEIPT') && sale.paymentStatus !== 'PAID';
      }

      return true;
    });
  }, [sales, searchQuery, selectedTab]);

  // Executive metrics calculations
  const invoiceMetrics = useMemo(() => {
    const commercialSales = sales.filter((s) => s.type === 'INVOICE' || s.type === 'RECEIPT');
    const totalBilledUSD = commercialSales.reduce((acc, s) => acc + s.totalUSD, 0);
    const totalPaidUSD = commercialSales.reduce((acc, s) => acc + s.amountPaidUSD, 0);
    const totalDebtsUSD = commercialSales.reduce((acc, s) => acc + s.remainingDebtUSD, 0);
    const recoveryRate = totalBilledUSD > 0 ? Math.round((totalPaidUSD / totalBilledUSD) * 100) : 100;
    const normalizedCount = commercialSales.filter((s) => s.isNormalizedDGI).length;

    return {
      totalBilledUSD,
      totalBilledCDF: Math.round(totalBilledUSD * rate),
      totalPaidUSD,
      totalPaidCDF: Math.round(totalPaidUSD * rate),
      totalDebtsUSD,
      totalDebtsCDF: Math.round(totalDebtsUSD * rate),
      recoveryRate,
      normalizedCount,
      totalCount: commercialSales.length,
    };
  }, [sales, rate]);

  const handleExportExcel = () => {
    const facturesData = filteredSales.map((s) => ({
      Numero: s.saleNumber,
      Type: s.type,
      Client: s.clientName,
      Telephone: s.clientPhone,
      Date: s.createdAt,
      TotalUSD: s.totalUSD,
      TotalCDF: s.totalCDF,
      TVA_USD: s.taxAmountUSD,
      PayeUSD: s.amountPaidUSD,
      SoldeUSD: s.remainingDebtUSD,
      Statut: s.paymentStatus,
      ModePaiement: s.paymentMethod,
      NFU_DGI: s.dgiNfu || '',
      CodeSecurite: s.dgiSecurityCode || '',
    }));

    const articlesData: any[] = [];
    filteredSales.forEach((s) => {
      s.items.forEach((it) => {
        articlesData.push({
          NumeroFacture: s.saleNumber,
          Client: s.clientName,
          Date: s.createdAt,
          CodeArticle: it.code,
          Article: it.name,
          GroupeTVA: it.taxGroup,
          Quantite: it.quantity,
          Unite: it.unit,
          PrixUnitaireUSD: it.unitPriceUSD,
          TotalLigneUSD: it.subtotalUSD,
        });
      });
    });

    exportToExcel(`CongoBiz_Factures_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { sheetName: 'Factures_Synthese', data: facturesData },
      { sheetName: 'Lignes_Articles', data: articlesData },
    ]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header (hidden if embedded) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Facturation & Devis Proforma
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Émission, suivi des encaissements et factures certifiées DGI RDC.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Générer et télécharger le rapport PDF des factures et créances"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Rapport PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Exporter vers Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              onClick={() => exportSyscohadaJournal(sales, expenses, settings, rate)}
              className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Journal SYSCOHADA (OHADA)"
            >
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">OHADA</span>
              <span>Compta</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Nouvelle Facture</span>
            </button>
          </div>
        </div>
      )}

      {/* Executive Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Chiffre d’Affaires Émis</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 tracking-tight">
              ${invoiceMetrics.totalBilledUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-mono-nums text-slate-500">
              {invoiceMetrics.totalBilledCDF.toLocaleString('fr-FR')} CDF
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100 flex items-center gap-1">
            <span>{invoiceMetrics.totalCount} factures émises</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Total Encaissé</span>
            <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {invoiceMetrics.recoveryRate}%
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-emerald-700 tracking-tight">
              ${invoiceMetrics.totalPaidUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-mono-nums text-slate-500">
              {invoiceMetrics.totalPaidCDF.toLocaleString('fr-FR')} CDF
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100 flex items-center gap-1">
            <span>Règlement direct ou Mobile Money</span>
          </div>
        </div>

        {/* Outstanding Debts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Créances à Recouvrer</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-rose-600 tracking-tight">
              ${invoiceMetrics.totalDebtsUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-mono-nums text-slate-500">
              {invoiceMetrics.totalDebtsCDF.toLocaleString('fr-FR')} CDF
            </div>
          </div>
          <div className="text-[11px] text-rose-600 font-medium pt-1 border-t border-slate-100 flex items-center gap-1">
            <span>{sales.filter((s) => s.remainingDebtUSD > 0).length} client(s) avec solde dû</span>
          </div>
        </div>

        {/* DGI Compliance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Conformité DGI DEF</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 tracking-tight">
              {invoiceMetrics.normalizedCount} <span className="text-sm font-normal text-slate-400">/ {invoiceMetrics.totalCount}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Factures avec NFU & Sceau fiscal
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100 flex items-center gap-1">
            <span>Dispositif Électronique Fiscal actif</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tous les documents', count: sales.length },
            {
              id: 'INVOICE',
              label: 'Factures & Reçus',
              count: sales.filter((s) => s.type === 'INVOICE' || s.type === 'RECEIPT').length,
            },
            {
              id: 'QUOTE_PROFORMA',
              label: 'Devis Proforma',
              count: sales.filter((s) => s.type === 'QUOTE_PROFORMA').length,
            },
            {
              id: 'UNPAID',
              label: 'Créances Impayées',
              count: sales.filter((s) => (s.type === 'INVOICE' || s.type === 'RECEIPT') && s.paymentStatus !== 'PAID').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                selectedTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono-nums font-semibold px-1.5 py-0.2 rounded-md ${
                  selectedTab === tab.id
                    ? 'bg-slate-800 text-amber-300'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Rechercher n° facture, client, NFU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/70 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">N° Document</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 text-right">Montant Total</th>
                <th className="py-3 px-4 text-right">Payé</th>
                <th className="py-3 px-4 text-right">Reste Dû</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-nums">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-sans text-xs">
                    Aucun document ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isQuote = sale.type === 'QUOTE_PROFORMA';
                  const statusInfo = getStatusBadge(sale.paymentStatus);
                  const client = clients.find((c) => c.id === sale.clientId) || {
                    id: sale.clientId || 'guest',
                    name: sale.clientName,
                    phone: sale.clientPhone || '',
                    type: 'COMPANY' as const,
                    city: '',
                    totalSpentUSD: sale.totalUSD,
                    outstandingDebtUSD: sale.remainingDebtUSD,
                    createdAt: sale.createdAt,
                  };

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Sale Number */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{sale.saleNumber}</span>
                          {sale.isNormalizedDGI && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                              title="Facture Normalisée DGI DEF"
                            />
                          )}
                        </div>
                      </td>

                      {/* Doc Type */}
                      <td className="py-3 px-4 font-sans">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {getDocumentTypeLabel(sale.type)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(sale.createdAt)}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 truncate max-w-[200px]">
                        <div>
                          <span className="block truncate">{sale.clientName}</span>
                          {sale.clientNif && (
                            <span className="text-[10px] text-slate-400 font-mono-nums block truncate">
                              NIF : {sale.clientNif}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        <div>
                          <span>${sale.totalUSD.toFixed(2)}</span>
                          <span className="block text-[10px] font-normal text-slate-400">
                            {new Intl.NumberFormat('fr-FR').format(sale.totalCDF)} FC
                          </span>
                        </div>
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-4 text-right font-mono-nums text-emerald-700 font-semibold">
                        ${sale.amountPaidUSD.toFixed(2)}
                      </td>

                      {/* Remaining Debt */}
                      <td className="py-3 px-4 text-right font-mono-nums">
                        {sale.remainingDebtUSD > 0 ? (
                          <span className="font-bold text-rose-600">
                            ${sale.remainingDebtUSD.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Status with clean unboxed dot indicator */}
                      <td className="py-3 px-4 text-center font-sans">
                        {isQuote ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>En attente</span>
                          </span>
                        ) : sale.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Soldé</span>
                          </span>
                        ) : sale.paymentStatus === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Partiel</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Non payé</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          {/* Convert Proforma if quote */}
                          {isQuote && (
                            <button
                              onClick={() => convertQuoteToInvoice(sale.id)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Convertir ce devis en facture ferme"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Convertir</span>
                            </button>
                          )}

                          {/* Record payment if debt exists */}
                          {!isQuote && sale.remainingDebtUSD > 0 && (
                            <button
                              onClick={() => setSelectedSaleForPayment(sale)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Enregistrer un versement / règlement"
                            >
                              <CreditCard className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}

                          {/* Modify / Edit */}
                          <button
                            onClick={() => setSelectedSaleToEdit(sale)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isQuote ? 'Modifier ce devis proforma' : 'Modifier cette facture'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Direct Send */}
                          <button
                            onClick={() => setActiveWhatsAppClient({ client, sale })}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Envoyer la facture et le récapitulatif par WhatsApp en 1 clic"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Print */}
                          <button
                            onClick={() => setActivePrintSale(sale)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Imprimer Facture A4 ou Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setSaleToDelete(sale)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Recording Modal */}
      {selectedSaleForPayment && (
        <PaymentRecordModal
          sale={selectedSaleForPayment}
          onClose={() => setSelectedSaleForPayment(null)}
        />
      )}

      {/* Invoice / Quote Edit Modal */}
      <InvoiceEditModal
        isOpen={Boolean(selectedSaleToEdit)}
        saleToEdit={selectedSaleToEdit}
        onClose={() => setSelectedSaleToEdit(null)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(saleToDelete)}
        title={saleToDelete?.type === 'QUOTE_PROFORMA' ? 'Supprimer le devis proforma ?' : 'Supprimer la facture / reçu ?'}
        message={`Êtes-vous certain de vouloir supprimer définitivement ${saleToDelete?.saleNumber} (${saleToDelete?.clientName}) ? Cette opération réajustera automatiquement les stocks des articles et les créances associées.`}
        details={saleToDelete ? `Montant total: $${saleToDelete.totalUSD.toFixed(2)} USD · Solde: $${saleToDelete.remainingDebtUSD.toFixed(2)} USD` : ''}
        confirmText="Supprimer"
        onConfirm={() => {
          if (saleToDelete) {
            deleteSale(saleToDelete.id);
            setSaleToDelete(null);
          }
        }}
        onCancel={() => setSaleToDelete(null)}
      />

      {/* Global Sales PDF Report Modal */}
      <SalesReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
