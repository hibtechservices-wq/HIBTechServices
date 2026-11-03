import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, Sale } from '../../types';
import { formatDualCurrency, formatDate, cleanPhoneNumber } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelUtils';
import { ClientModal } from './ClientModal';
import { ClientsReportModal } from './ClientsReportModal';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  Search,
  Plus,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Edit2,
  Trash2,
  Upload,
  Printer,
  AlertCircle,
  FileText,
  CreditCard,
  ChevronRight,
  FileSpreadsheet,
  Globe,
  Users as UsersIcon,
  TrendingUp,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const {
    clients,
    sales,
    deleteClient,
    settings,
    setActiveWhatsAppClient,
    setActivePrintSale,
    setPortalClient,
    setActiveTab,
  } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEBTORS' | 'COMPANIES' | 'INDIVIDUALS'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.phone.includes(searchQuery) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.commune && c.commune.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType === 'DEBTORS') return c.outstandingDebtUSD > 0;
      if (filterType === 'COMPANIES') return c.type === 'COMPANY';
      if (filterType === 'INDIVIDUALS') return c.type === 'INDIVIDUAL';

      return true;
    });
  }, [clients, searchQuery, filterType]);

  // Aggregate metrics
  const clientMetrics = useMemo(() => {
    const totalDebts = clients.reduce((acc, c) => acc + (c.outstandingDebtUSD || 0), 0);
    const totalSpent = clients.reduce((acc, c) => acc + (c.totalSpentUSD || 0), 0);
    const debtorsCount = clients.filter((c) => c.outstandingDebtUSD > 0).length;
    const companiesCount = clients.filter((c) => c.type === 'COMPANY').length;
    const individualsCount = clients.filter((c) => c.type === 'INDIVIDUAL').length;

    return {
      totalCount: clients.length,
      companiesCount,
      individualsCount,
      totalDebtsUSD: totalDebts,
      totalDebtsCDF: Math.round(totalDebts * rate),
      totalSpentUSD: totalSpent,
      totalSpentCDF: Math.round(totalSpent * rate),
      debtorsCount,
    };
  }, [clients, rate]);

  const handleExportExcel = () => {
    const data = filteredClients.map((c) => ({
      Nom_Complet: c.name,
      Entreprise: c.companyName || '',
      Type: c.type,
      Telephone: c.phone,
      WhatsApp: c.whatsapp || c.phone,
      Email: c.email || '',
      Ville: c.city,
      Commune_Quartier: c.commune || '',
      Adresse: c.address || '',
      NIF_RCCM: c.rccmOrNif || '',
      TotalAchatsUSD: c.totalSpentUSD,
      SoldeDetteUSD: c.outstandingDebtUSD,
      SoldeDetteCDF: Math.round(c.outstandingDebtUSD * rate),
    }));
    exportToExcel(`CongoBiz_Clients_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { sheetName: 'Clients_CRM', data },
    ]);
  };

  // Sales for the selected client in detail drawer
  const clientSales = useMemo(() => {
    if (!selectedClientForDetails) return [];
    return sales.filter((s) => s.clientId === selectedClientForDetails.id);
  }, [sales, selectedClientForDetails]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Clients & Gestion des Créances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Répertoire commercial, suivi des soldes débiteurs et relances directes WhatsApp.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Générer et télécharger l'état des créances et répertoire clients en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Relevé Créances (PDF)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Exporter tous les clients vers Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Importer des clients depuis un fichier Excel (.xlsx, .xls)"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Importer</span>
          </button>

          <button
            onClick={() => {
              setClientToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nouveau Client</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Répertoire Global</span>
            <UsersIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 tracking-tight">
              {clientMetrics.totalCount}
            </div>
            <div className="text-[11px] text-slate-500">
              {clientMetrics.companiesCount} sociétés · {clientMetrics.individualsCount} particuliers
            </div>
          </div>
        </div>

        {/* Total Debts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Créances Totales Dues</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-rose-600 tracking-tight">
              ${clientMetrics.totalDebtsUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-mono-nums text-slate-500">
              {clientMetrics.totalDebtsCDF.toLocaleString('fr-FR')} CDF
            </div>
          </div>
        </div>

        {/* Debtors Count */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Comptes Débiteurs</span>
            <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
              {clientMetrics.debtorsCount}
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-slate-900 tracking-tight">
              {clientMetrics.totalCount > 0 ? Math.round((clientMetrics.debtorsCount / clientMetrics.totalCount) * 100) : 0}%
            </div>
            <div className="text-[11px] text-slate-500">
              des clients ont des factures en attente
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-500">Volume d'Affaires</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums text-emerald-700 tracking-tight">
              ${clientMetrics.totalSpentUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] font-mono-nums text-slate-500">
              Cumul des commandes et abonnements
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tous les clients', count: clients.length },
            {
              id: 'DEBTORS',
              label: 'Créances dues',
              count: clients.filter((c) => c.outstandingDebtUSD > 0).length,
              danger: true,
            },
            {
              id: 'COMPANIES',
              label: 'Entreprises',
              count: clients.filter((c) => c.type === 'COMPANY').length,
            },
            {
              id: 'INDIVIDUALS',
              label: 'Particuliers',
              count: clients.filter((c) => c.type === 'INDIVIDUAL').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono-nums font-semibold px-1.5 py-0.2 rounded-md ${
                  filterType === tab.id
                    ? 'bg-slate-800 text-amber-300'
                    : tab.danger
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Rechercher nom, téléphone, ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white p-16 text-center rounded-2xl border border-slate-200/80 text-slate-400 text-xs">
            Aucun client ne correspond à ce critère de recherche.
          </div>
        ) : (
          filteredClients.map((client) => {
            const hasDebt = client.outstandingDebtUSD > 0;
            const dualDebt = formatDualCurrency(client.outstandingDebtUSD, rate);
            const dualSpent = formatDualCurrency(client.totalSpentUSD, rate);

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div>
                  {/* Top line: Type & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                        {client.type === 'COMPANY' ? (
                          <Building className="w-4.5 h-4.5 text-slate-700" />
                        ) : (
                          <User className="w-4.5 h-4.5 text-slate-700" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          {client.type === 'COMPANY' ? 'Société / Entité' : 'Particulier'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {client.city} {client.commune ? `· ${client.commune}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setPortalClient(client);
                          setActiveTab('portal');
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Ouvrir le Portail Client en ligne"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setClientToEdit(client);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Modifier la fiche"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Client Name */}
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {client.name}
                  </h3>
                  {client.companyName && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {client.companyName}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono-nums font-medium text-slate-700">{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-500">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2 truncate text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary & Bottom Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Total Dépensé</span>
                      <span className="font-bold font-mono-nums text-slate-900 block mt-0.5">
                        ${client.totalSpentUSD.toFixed(2)}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${hasDebt ? 'bg-rose-50/70 border-rose-200/80' : 'bg-slate-50 border-slate-100'}`}>
                      <span className={`text-[10px] block font-medium ${hasDebt ? 'text-rose-700 font-semibold' : 'text-slate-400'}`}>
                        {hasDebt ? 'Créance à Recouvrer' : 'Solde Régularisé'}
                      </span>
                      <span className={`font-bold font-mono-nums block mt-0.5 ${hasDebt ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {hasDebt ? `$${client.outstandingDebtUSD.toFixed(2)}` : '$0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {hasDebt ? (
                      <button
                        onClick={() => setActiveWhatsAppClient({ client, sale: null })}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Relancer WhatsApp</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedClientForDetails(client)}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Historique Achats</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedClientForDetails(client)}
                      className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
                      title="Voir détails & historique complet"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Client History & Invoices Drawer */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base">{selectedClientForDetails.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedClientForDetails.phone} · {selectedClientForDetails.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Balances */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Total Achats & Prestations :</span>
                  <span className="font-bold text-lg font-mono-nums text-slate-900">
                    ${selectedClientForDetails.totalSpentUSD.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Solde Restant Dû :</span>
                  <span className={`font-bold text-lg font-mono-nums ${selectedClientForDetails.outstandingDebtUSD > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    ${selectedClientForDetails.outstandingDebtUSD.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Transactions List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[11px]">
                  Factures & Reçus Associés ({clientSales.length})
                </h4>

                {clientSales.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">Aucune transaction enregistrée pour ce client.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {clientSales.map((s) => (
                      <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold font-mono-nums text-slate-900 block">{s.saleNumber}</span>
                          <span className="text-[11px] text-slate-500">{formatDate(s.createdAt)}</span>
                        </div>
                        <div className="text-right font-mono-nums">
                          <span className="font-bold text-slate-900 block">${s.totalUSD.toFixed(2)}</span>
                          <span className="text-[11px] text-emerald-700">Encaissé: ${s.amountPaidUSD.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClientForDetails(null);
                            setActivePrintSale(s);
                          }}
                          className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium ml-3 cursor-pointer"
                        >
                          Imprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(clientToDelete)}
        title="Supprimer la fiche client ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le client "${clientToDelete?.name}" ?`}
        details={clientToDelete ? `Solde créance en cours : $${clientToDelete.outstandingDebtUSD.toFixed(2)} USD` : ''}
        confirmText="Supprimer"
        onConfirm={() => {
          if (clientToDelete) {
            deleteClient(clientToDelete.id);
            setClientToDelete(null);
          }
        }}
        onCancel={() => setClientToDelete(null)}
      />

      {/* PDF Clients & Debts Report Modal */}
      <ClientsReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleType="CLIENTS"
        title="Importer des Clients depuis Excel / CSV"
      />
    </div>
  );
};
