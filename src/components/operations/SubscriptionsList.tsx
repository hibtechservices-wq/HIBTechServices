import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionContract, SubscriptionType, SubscriptionStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionContractPrintModal } from './SubscriptionContractPrintModal';
import { SubscriptionWhatsAppModal } from './SubscriptionWhatsAppModal';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileText,
  Edit,
  Trash2,
  Radio,
  Video,
  Activity,
  Layers,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  Filter,
  ArrowRight,
  Printer,
  MessageSquare
} from 'lucide-react';

export const SubscriptionsList: React.FC = () => {
  const {
    subscriptions,
    renewSubscription,
    generateSubscriptionInvoice,
    deleteSubscription,
    showNotification,
    settings
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState<SubscriptionContract | null>(null);
  const [activePrintSub, setActivePrintSub] = useState<SubscriptionContract | null>(null);
  const [activeWhatsAppSub, setActiveWhatsAppSub] = useState<SubscriptionContract | null>(null);

  // Check days remaining until next billing
  const getDaysUntilBilling = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtered Subscriptions
  const filteredSubs = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        sub.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.planName && sub.planName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.accountIdentifier && sub.accountIdentifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sub.equipmentSerialNumber && sub.equipmentSerialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'ALL' || sub.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [subscriptions, searchTerm, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let activeCount = 0;
    let mrrUSD = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;

    subscriptions.forEach((sub) => {
      if (sub.status === 'ACTIVE' || sub.status === 'PENDING_RENEWAL') {
        activeCount++;
        // Calculate monthly equivalent
        if (sub.billingCycle === 'MONTHLY') mrrUSD += sub.priceUSD;
        else if (sub.billingCycle === 'QUARTERLY') mrrUSD += sub.priceUSD / 3;
        else if (sub.billingCycle === 'SEMI_ANNUAL') mrrUSD += sub.priceUSD / 6;
        else if (sub.billingCycle === 'ANNUAL') mrrUSD += sub.priceUSD / 12;
      }

      const daysLeft = getDaysUntilBilling(sub.nextBillingDate);
      if (daysLeft < 0 || sub.status === 'OVERDUE') {
        overdueCount++;
      } else if (daysLeft <= 7) {
        dueSoonCount++;
      }
    });

    return { activeCount, mrrUSD, dueSoonCount, overdueCount };
  }, [subscriptions]);

  const handleEdit = (sub: SubscriptionContract) => {
    setSubToEdit(sub);
    setIsFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setSubToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string, contractNumber: string) => {
    if (window.confirm(`Confirmez-vous la suppression du contrat d'abonnement ${contractNumber} ?`)) {
      deleteSubscription(id);
    }
  };

  const handleQuickRenew = (sub: SubscriptionContract) => {
    renewSubscription(sub.id, 1);
  };

  const handleInvoiceClick = (sub: SubscriptionContract) => {
    const sale = generateSubscriptionInvoice(sub.id);
    if (sale) {
      showNotification(`Facture #${sale.saleNumber} générée pour ${sub.clientName} (Prête pour impression)`, 'success');
    }
  };

  const getTypeBadge = (type: SubscriptionType) => {
    switch (type) {
      case 'STARLINK_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-3 h-3" /> Starlink Mensuel
          </span>
        );
      case 'IT_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Activity className="w-3 h-3" /> Maintenance IT
          </span>
        );
      case 'CCTV_SURVEILLANCE_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Video className="w-3 h-3" /> Maintenance CCTV
          </span>
        );
      case 'NETWORK_SLA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-3 h-3" /> SLA Réseau
          </span>
        );
    }
  };

  const getDueDateBadge = (dateString: string, status: SubscriptionStatus) => {
    const days = getDaysUntilBilling(dateString);

    if (status === 'OVERDUE' || days < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 border border-red-800/80 text-red-400">
          <AlertTriangle className="w-3 h-3" /> Expiré ({Math.abs(days)}j de retard)
        </span>
      );
    }

    if (days <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 border border-amber-800/80 text-amber-400 animate-pulse">
          <Clock className="w-3 h-3" /> Renouvellement dans {days}j
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
        <CheckCircle2 className="w-3 h-3" /> Dans {days} jours
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Contrats Actifs</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.activeCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">MRR (Revenu Récurrent Mensuel)</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">
              ${stats.mrrUSD.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-400">
              ≈ {(stats.mrrUSD * (settings.exchangeRateUSD_CDF || 2850)).toLocaleString('fr-FR')} CDF/mois
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Échéances Imminentes (≤ 7j)</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{stats.dueSoonCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Contrats en Retard</p>
            <p className="text-2xl font-bold text-rose-400 mt-0.5">{stats.overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher N° contrat, client, forfait, N° Starlink..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tous les forfaits</option>
              <option value="STARLINK_SERVICE">Starlink Mensuel</option>
              <option value="IT_MAINTENANCE">Maintenance IT</option>
              <option value="CCTV_SURVEILLANCE_MAINTENANCE">Maintenance CCTV</option>
              <option value="NETWORK_SLA">SLA Réseau</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="PENDING_RENEWAL">Échéance Proche</option>
              <option value="OVERDUE">En Retard</option>
              <option value="SUSPENDED">Suspendu</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouveau Contrat d'Abonnement
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">N° Contrat & Forfait</th>
                <th className="px-4 py-3.5">Client & Compte Matériel</th>
                <th className="px-4 py-3.5">Tarif & Périodicité</th>
                <th className="px-4 py-3.5">Prochaine Échéance</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-base font-medium text-slate-400">Aucun abonnement trouvé</p>
                    <p className="text-xs text-slate-500 mt-1">Créez un contrat Starlink ou de maintenance d'entreprise.</p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white font-mono flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{sub.contractNumber}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-200 mt-0.5">
                        {sub.title}
                      </div>
                      <div className="mt-1">{getTypeBadge(sub.type)}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {sub.clientName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Tél: {sub.clientPhone}
                      </div>
                      {(sub.accountIdentifier || sub.equipmentSerialNumber) && (
                        <div className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded mt-1 inline-block">
                          ID: {sub.accountIdentifier || sub.equipmentSerialNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-emerald-400 text-sm">
                        ${sub.priceUSD.toLocaleString('fr-FR')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {sub.billingCycle === 'MONTHLY'
                          ? '/ mois'
                          : sub.billingCycle === 'QUARTERLY'
                          ? '/ trimestre'
                          : sub.billingCycle === 'SEMI_ANNUAL'
                          ? '/ semestre'
                          : '/ an'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200 text-xs">
                        {formatDate(sub.nextBillingDate)}
                      </div>
                      <div className="mt-1">{getDueDateBadge(sub.nextBillingDate, sub.status)}</div>
                      {sub.lastInvoicedDate && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          Dernière facture: {formatDate(sub.lastInvoicedDate)}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : sub.status === 'PENDING_RENEWAL'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : sub.status === 'OVERDUE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                      }`}>
                        {sub.status === 'ACTIVE' ? 'Actif' : sub.status === 'PENDING_RENEWAL' ? 'Échéance' : sub.status === 'OVERDUE' ? 'Retard' : sub.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInvoiceClick(sub)}
                          title="Facturer en 1 clic (Génère la facture conforme DGI et ouvre le dialogue d'impression)"
                          className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Facturer</span>
                        </button>

                        <button
                          onClick={() => handleQuickRenew(sub)}
                          title="Renouveler (+1 mois)"
                          className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setActivePrintSub(sub)}
                          title="Imprimer le Contrat d'Abonnement & SLA (A4 officiel + C:\hibtech)"
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setActiveWhatsAppSub(sub)}
                          title="Envoyer une notification / relance d'échéance par WhatsApp"
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(sub)}
                          title="Modifier le contrat"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(sub.id, sub.contractNumber)}
                          title="Supprimer"
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Form Modal */}
      <SubscriptionModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSubToEdit(null);
        }}
        subscriptionToEdit={subToEdit}
      />

      {/* Printable Contract Modal */}
      <SubscriptionContractPrintModal
        subscription={activePrintSub}
        onClose={() => setActivePrintSub(null)}
      />

      {/* WhatsApp Reminder Modal */}
      <SubscriptionWhatsAppModal
        subscription={activeWhatsAppSub}
        onClose={() => setActiveWhatsAppSub(null)}
      />
    </div>
  );
};
