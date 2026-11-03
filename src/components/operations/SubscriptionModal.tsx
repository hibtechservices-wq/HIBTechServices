import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionContract, SubscriptionType, BillingCycle, SubscriptionStatus } from '../../types';
import {
  CreditCard,
  X,
  Radio,
  ShieldCheck,
  Video,
  Activity,
  Calendar,
  DollarSign,
  User,
  HardDrive
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionToEdit?: SubscriptionContract | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptionToEdit
}) => {
  const { clients, equipments, settings, addSubscription, updateSubscription, showNotification } = useApp();

  const [contractNumber, setContractNumber] = useState('');
  const [type, setType] = useState<SubscriptionType>('STARLINK_SERVICE');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [equipmentSerialNumber, setEquipmentSerialNumber] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [priceUSD, setPriceUSD] = useState<number>(350);
  const [startDate, setStartDate] = useState('');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [planName, setPlanName] = useState('Starlink Priorité Entreprise 1TB');
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [coverageDetails, setCoverageDetails] = useState('Support technique 24/7, monitoring de la liaison et intervention sur site en cas de coupure');
  const [autoRenew, setAutoRenew] = useState(true);
  const [notes, setNotes] = useState('');

  const exchangeRate = settings.exchangeRateUSD_CDF || 2850;

  useEffect(() => {
    if (subscriptionToEdit) {
      setContractNumber(subscriptionToEdit.contractNumber);
      setType(subscriptionToEdit.type);
      setTitle(subscriptionToEdit.title);
      setClientId(subscriptionToEdit.clientId);
      setClientName(subscriptionToEdit.clientName);
      setClientPhone(subscriptionToEdit.clientPhone);
      setClientEmail(subscriptionToEdit.clientEmail || '');
      setEquipmentId(subscriptionToEdit.equipmentId || '');
      setEquipmentSerialNumber(subscriptionToEdit.equipmentSerialNumber || '');
      setBillingCycle(subscriptionToEdit.billingCycle);
      setPriceUSD(subscriptionToEdit.priceUSD);
      setStartDate(subscriptionToEdit.startDate.substring(0, 10));
      setNextBillingDate(subscriptionToEdit.nextBillingDate.substring(0, 10));
      setExpirationDate(subscriptionToEdit.expirationDate.substring(0, 10));
      setStatus(subscriptionToEdit.status);
      setPlanName(subscriptionToEdit.planName || '');
      setAccountIdentifier(subscriptionToEdit.accountIdentifier || '');
      setCoverageDetails(subscriptionToEdit.coverageDetails || '');
      setAutoRenew(subscriptionToEdit.autoRenew);
      setNotes(subscriptionToEdit.notes || '');
    } else {
      const year = new Date().getFullYear();
      const random = Math.floor(100 + Math.random() * 900);
      setContractNumber(`SUB-${year}-${random}`);
      setType('STARLINK_SERVICE');
      setTitle('Abonnement Starlink Priorité Entreprise');
      const today = new Date();
      const inOneMonth = new Date();
      inOneMonth.setMonth(today.getMonth() + 1);
      const inOneYear = new Date();
      inOneYear.setFullYear(today.getFullYear() + 1);

      setStartDate(today.toISOString().substring(0, 10));
      setNextBillingDate(inOneMonth.toISOString().substring(0, 10));
      setExpirationDate(inOneYear.toISOString().substring(0, 10));
      setStatus('ACTIVE');
      setBillingCycle('MONTHLY');
      setPriceUSD(350);
      setPlanName('Priorité Entreprise 1TB - Débit non bridé');
      setAccountIdentifier(`SLK-HT-${Math.floor(10000 + Math.random() * 90000)}`);
      setCoverageDetails('Assistance technique prioritaire 24/7, monitoring réseau et remplacement antenne sous 24h.');
      setAutoRenew(true);
      setNotes('');

      if (clients.length > 0) {
        setClientId(clients[0].id);
        setClientName(clients[0].name);
        setClientPhone(clients[0].phone);
        setClientEmail(clients[0].email || '');
      }
    }
  }, [subscriptionToEdit, isOpen]);

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const selected = clients.find((c) => c.id === cId);
    if (selected) {
      setClientName(selected.name);
      setClientPhone(selected.phone);
      setClientEmail(selected.email || '');
    }
  };

  const handleEquipmentChange = (eqId: string) => {
    setEquipmentId(eqId);
    const selected = equipments.find((eq) => eq.id === eqId);
    if (selected) {
      setEquipmentSerialNumber(selected.serialNumber || (selected.starlink?.kitNumber || ''));
      if (!title || title.includes('Starlink')) {
        setTitle(`Abonnement & SAV ${selected.name}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractNumber || !title || !clientName || priceUSD <= 0) {
      showNotification('Veuillez remplir le N° de contrat, l’intitulé, le client et le montant', 'error');
      return;
    }

    const priceCDF = Math.round(priceUSD * exchangeRate);

    const subData = {
      contractNumber,
      type,
      title,
      clientId,
      clientName,
      clientPhone,
      clientEmail: clientEmail || undefined,
      equipmentId: equipmentId || undefined,
      equipmentSerialNumber: equipmentSerialNumber || undefined,
      billingCycle,
      priceUSD,
      priceCDF,
      startDate,
      nextBillingDate,
      expirationDate,
      status,
      planName,
      accountIdentifier,
      coverageDetails,
      autoRenew,
      notes
    };

    if (subscriptionToEdit) {
      updateSubscription(subscriptionToEdit.id, subData);
      showNotification(`Abonnement ${contractNumber} mis à jour avec succès`, 'success');
    } else {
      addSubscription(subData);
      showNotification(`Contrat d'abonnement ${contractNumber} créé avec succès`, 'success');
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {subscriptionToEdit ? `Modifier Contrat #${contractNumber}` : "Nouveau Contrat d'Abonnement / SAV"}
              </h2>
              <p className="text-xs text-slate-400">
                Abonnement récurrent Starlink, contrat de maintenance informatique & SLA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm text-slate-200">
          {/* Section 1: Contrat & Type */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> 1. Contrat & Forfait de Service
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">N° Contrat *</label>
                <input
                  type="text"
                  required
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type de Contrat *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SubscriptionType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="STARLINK_SERVICE">Abonnement Starlink (Satellite)</option>
                  <option value="IT_MAINTENANCE">Contrat Maintenance IT Entreprise</option>
                  <option value="CCTV_SURVEILLANCE_MAINTENANCE">Maintenance Vidéosurveillance & Caméras</option>
                  <option value="NETWORK_SLA">SLA Réseau & Astreinte 24/7</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Statut *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Actif (À jour)</option>
                  <option value="PENDING_RENEWAL">Échéance Proche (≤ 7 jours)</option>
                  <option value="OVERDUE">En Retard / Non Payé</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="CANCELLED">Résilié</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Intitulé de l'Abonnement *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Forfait Starlink Priorité 1TB - Site Minier Mutanda"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom du Plan / Forfait</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Ex: Starlink Priority 1TB"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Client & Équipement Lié */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <User className="w-4 h-4" /> 2. Client & Matériel Lié
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sélectionner un Client Enregistré *</label>
                <select
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom Client / Raison Sociale</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Téléphone de Contact</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email pour Alertes / Factures</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="contact@entreprise.cd"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Lier à un Équipement du Parc (Optionnel)</label>
                <select
                  value={equipmentId}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Aucun équipement spécifique lié --</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.type}] {eq.name} — {eq.serialNumber} ({eq.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Identifiant Compte / N° Série Kit</label>
                <input
                  type="text"
                  value={accountIdentifier || equipmentSerialNumber}
                  onChange={(e) => setAccountIdentifier(e.target.value)}
                  placeholder="Ex: KIT-0039281 / ACC-2841"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tarification & Échéances */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> 3. Tarification & Calendrier de Facturation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Périodicité *</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="MONTHLY">Mensuelle (Chaque mois)</option>
                  <option value="QUARTERLY">Trimestrielle (3 mois)</option>
                  <option value="SEMI_ANNUAL">Semestrielle (6 mois)</option>
                  <option value="ANNUAL">Annuelle (1 an)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Montant par Période (USD) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={priceUSD}
                  onChange={(e) => setPriceUSD(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold text-base focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ≈ {(priceUSD * exchangeRate).toLocaleString('fr-FR')} CDF
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date de Début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Prochaine Échéance Facture *</label>
                <input
                  type="date"
                  required
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-400 mb-1">Détails de Couverture / SLA Inclus</label>
                <textarea
                  rows={2}
                  value={coverageDetails}
                  onChange={(e) => setCoverageDetails(e.target.value)}
                  placeholder="Ex: Monitoring temps réel, remplacement antenne sous 24h, 2 visites de maintenance préventive incluses par an"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="md:col-span-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <label htmlFor="autoRenew" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Renouvellement automatique par tacite reconduction avec alertes périodiques
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              {subscriptionToEdit ? "Enregistrer les modifications" : "Créer le Contrat d'Abonnement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
