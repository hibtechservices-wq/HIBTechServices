import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanySettings } from '../../types';
import { exportToExcel } from '../../utils/excelUtils';
import { exportSyscohadaJournal } from '../../utils/ohadaExport';
import { AuditTrailModal } from '../audit/AuditTrailModal';
import { generateDefaultStampSvg, generateDefaultSignatureSvg, generateCashPaidStampSvg } from '../../utils/stampGenerator';
import {
  Building,
  Save,
  RotateCcw,
  Download,
  Upload,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Ban,
  FileSpreadsheet,
  FileText,
  Stamp,
  PenTool,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Printer,
  Banknote,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    sales,
    products,
    clients,
    expenses,
    equipments,
    updateSettings,
    resetToDemoData,
    exportDatabaseJSON,
    importDatabaseJSON,
    setIsDataWipeModalOpen,
  } = useApp();

  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState(false);

  const handleExportMasterExcel = () => {
    const rate = settings.exchangeRateUSD_CDF || 2850;

    const facturesData = sales.map((s) => ({
      Numero: s.saleNumber,
      Type: s.type,
      Client: s.clientName,
      Telephone: s.clientPhone,
      Date: s.createdAt,
      TotalUSD: s.totalUSD,
      TotalCDF: s.totalCDF,
      PayeUSD: s.amountPaidUSD,
      SoldeUSD: s.remainingDebtUSD,
      Statut: s.paymentStatus,
      ModePaiement: s.paymentMethod,
      NFU_DGI: s.dgiNfu || '',
    }));

    const articlesData = products.map((p) => ({
      Reference: p.code,
      Designation: p.name,
      Type: p.type,
      Categorie: p.category,
      Unite: p.unit,
      PrixVenteUSD: p.priceUSD,
      CoutAchatUSD: p.costPriceUSD,
      StockActuel: p.type === 'PRODUCT' ? p.stockQty : 'N/A',
      SeuilAlerte: p.type === 'PRODUCT' ? p.minStockAlert : 'N/A',
      GroupeTVA: p.taxGroup,
    }));

    const clientsData = clients.map((c) => ({
      Nom: c.name,
      Entreprise: c.companyName || '',
      Type: c.type,
      Telephone: c.phone,
      WhatsApp: c.whatsapp || c.phone,
      Email: c.email || '',
      Ville: c.city,
      Commune: c.commune || '',
      TotalAchatsUSD: c.totalSpentUSD,
      SoldeDetteUSD: c.outstandingDebtUSD,
      NIF_RCCM: c.rccmOrNif || '',
    }));

    const depensesData = expenses.map((e) => ({
      Description: e.description,
      Categorie: e.category,
      MontantUSD: e.amountUSD,
      MontantCDF: e.amountCDF,
      Date: e.date,
      ModePaiement: e.paymentMethod,
      Beneficiaire: e.beneficiary || '',
      PieceRef: e.receiptRef || '',
    }));

    const equipementsData = equipments.map((eq) => ({
      Nom: eq.name,
      Type: eq.type,
      Client: eq.clientName,
      Site: eq.siteName,
      NumeroSerie: eq.serialNumber,
      Statut: eq.status,
      DateInstallation: eq.installationDate,
      Technicien: eq.assignedTechnician || '',
      IP_Ou_SSID: eq.starlink?.publicIpOrCgnat || eq.cctvCamera?.ipAddress || eq.router?.ipLanGateway || eq.accessPoint?.primarySsid || '',
    }));

    exportToExcel(`CongoBiz_Grand_Livre_Complet_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { sheetName: 'Factures_Ventes', data: facturesData },
      { sheetName: 'Articles_Stock', data: articlesData },
      { sheetName: 'Clients_CRM', data: clientsData },
      { sheetName: 'Depenses_Charges', data: depensesData },
      { sheetName: 'Parc_Equipements', data: equipementsData },
    ]);
  };

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDatabaseJSON(content);
      if (ok) {
        alert('Sauvegarde restaurée avec succès !');
        window.location.reload();
      } else {
        setImportError(true);
      }
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (field: 'logoUrl' | 'signatureUrl' | 'stampUrl' | 'cashPaidStampUrl', file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("L'image sélectionnée est trop lourde (maximum 3 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      handleChange(field, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateDefaultStamp = () => {
    const stamp = generateDefaultStampSvg(formData.name, formData.city, formData.nif);
    handleChange('stampUrl', stamp);
  };

  const handleGenerateDefaultSignature = () => {
    const sig = generateDefaultSignatureSvg(formData.signatoryName || 'La Gérance');
    handleChange('signatureUrl', sig);
  };

  const handleGenerateCashPaidStamp = () => {
    const cashStamp = generateCashPaidStampSvg(formData.name, formData.cashierName);
    handleChange('cashPaidStampUrl', cashStamp);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Paramètres Fiscaux & Entreprise
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Mentions légales DGI RDC, Dispositif Électronique Fiscal (DEF), taux de conversion et Mobile Money.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Paramètres DGI enregistrés avec succès !</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
        {/* 1. Configuration Fiscale DGI RDC (Norme Facture Normalisée & DEF) */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
                1. Configuration Fiscale DGI & Dispositif DEF (RDC)
              </h2>
              <p className="text-xs text-neutral-500 font-normal">
                Exigences obligatoires de la Direction Générale des Impôts pour la facturation normalisée.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Numéro d'Impôt / NIF DGI (10 Caractères) *
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => handleChange('nif', e.target.value)}
                placeholder="Ex: A2109845B"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Centre des Impôts de Rattachement
              </label>
              <input
                type="text"
                value={formData.dgiCenter || ''}
                onChange={(e) => handleChange('dgiCenter', e.target.value)}
                placeholder="Ex: Centre des Impôts (CDI)"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                N° Dispositif Électronique Fiscal (DEF ID)
              </label>
              <input
                type="text"
                value={formData.dgiDefTerminalId || ''}
                onChange={(e) => handleChange('dgiDefTerminalId', e.target.value)}
                placeholder="Ex: DEF-CD-KIN-009482"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
              />
            </div>
          </div>

          {/* TVA Management & Configuration */}
          <div className="pt-2 border-t border-neutral-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Application de la TVA (Taxe sur la Valeur Ajoutée)
                </label>
                <p className="text-xs text-neutral-500">
                  Activez ou désactivez le calcul de la TVA sur l'ensemble de l'application (Caisse POS, factures, devis proforma).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleChange('dgiIsVatSubject', true);
                    handleChange('enableTaxByDefault', true);
                    if (!formData.taxPercent) handleChange('taxPercent', 16);
                  }}
                  className={`py-2 px-3.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    formData.dgiIsVatSubject
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>TVA Activée (16%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('dgiIsVatSubject', false);
                    handleChange('enableTaxByDefault', false);
                  }}
                  className={`py-2 px-3.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !formData.dgiIsVatSubject
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Désactiver la TVA (0%)</span>
                </button>
              </div>
            </div>

            {/* Status Information Box */}
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
              formData.dgiIsVatSubject
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              {formData.dgiIsVatSubject ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <span>
                    {formData.dgiIsVatSubject
                      ? 'Régime Assujetti Actif (TVA Standard 16%)'
                      : 'TVA Désactivée sur l\'ensemble du système (0% Hors Taxe)'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    formData.dgiIsVatSubject
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {formData.dgiIsVatSubject ? 'TVA 16% EN VIGUEUR' : 'TVA DÉSACTIVÉE / EXONÉRÉ'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {formData.dgiIsVatSubject
                    ? 'La TVA au taux légal de 16% est collectée par défaut sur les ventes en caisse POS, factures et devis. En caisse express, le caissier peut toujours désactiver la TVA ponctuellement pour un client exonéré.'
                    : 'Toutes les opérations (ventes au comptoir, tickets de caisse POS, factures et factures proforma) sont générées sans TVA (Taux 0%, Total TTC = Total HT). Conforme pour les petites entreprises, le régime synthétique de la patente ou les activités exonérées.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Régime Fiscal DGI
                </label>
                <select
                  value={formData.dgiRegime || (formData.dgiIsVatSubject ? 'Régime Général - Assujetti à la TVA' : 'Régime Synthétique (Non assujetti)')}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('dgiRegime', val);
                    if (val.includes('Non assujetti') || val.includes('Exonéré')) {
                      handleChange('dgiIsVatSubject', false);
                      handleChange('enableTaxByDefault', false);
                    } else {
                      handleChange('dgiIsVatSubject', true);
                      handleChange('enableTaxByDefault', true);
                    }
                  }}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
                >
                  <option value="Régime Général - Assujetti à la TVA">Régime Général (Assujetti TVA 16%)</option>
                  <option value="Grandes Entreprises (DGE)">Grandes Entreprises (DGE)</option>
                  <option value="Régime Synthétique (Non assujetti)">Régime Synthétique / Forfaitaire (Non assujetti)</option>
                  <option value="Exonération Spécifique">Régime Exonéré (Code des Investissements / ONG)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Taux TVA par Défaut (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!formData.dgiIsVatSubject}
                    value={formData.dgiIsVatSubject ? formData.taxPercent : 0}
                    onChange={(e) => handleChange('taxPercent', Number(e.target.value))}
                    className={`w-full font-mono-nums font-bold border rounded-lg px-3 py-2 text-xs focus:outline-none ${
                      formData.dgiIsVatSubject
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:bg-white'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  {formData.dgiIsVatSubject ? 'Mention Factures' : 'Motif de Non-assujettissement / Exonération'}
                </label>
                <input
                  type="text"
                  value={formData.dgiExemptionReason || ''}
                  onChange={(e) => handleChange('dgiExemptionReason', e.target.value)}
                  placeholder={formData.dgiIsVatSubject ? 'Ex: Taux standard 16% RDC' : 'Ex: Régime synthétique - TVA non applicable'}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Identité Commerciale & RCCM / Id. Nat */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Building className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
              2. Identité de l'Entreprise & Registres
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Raison Sociale / Nom de l'Entreprise *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Slogan Commercial
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => handleChange('slogan', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Numéro RCCM *
              </label>
              <input
                type="text"
                value={formData.rccm}
                onChange={(e) => handleChange('rccm', e.target.value)}
                placeholder="CD/KIN/RCCM/..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Numéro Id. Nat *
              </label>
              <input
                type="text"
                value={formData.idNat}
                onChange={(e) => handleChange('idNat', e.target.value)}
                placeholder="01-83-N..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Téléphone Principal *
              </label>
              <input
                type="text"
                value={formData.phone1}
                onChange={(e) => handleChange('phone1', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Email Professionnel
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Adresse & Ville (Lubumbashi, Haut-Katanga...)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Taux de Conversion USD / CDF */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
              3. Taux de Change Officiel (USD / CDF)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Taux de Conversion (1 USD en Franc Congolais) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  max="10000"
                  step="10"
                  value={formData.exchangeRateUSD_CDF}
                  onChange={(e) => handleChange('exchangeRateUSD_CDF', Number(e.target.value))}
                  className="w-full font-mono-nums font-bold text-base bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold text-xs">
                  FC
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Nom du Caissier / Agent Émetteur
              </label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => handleChange('cashierName', e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 4. Comptes Mobile Money RDC */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
              4. Comptes Mobile Money Marchands & Banques (RDC)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                N° Vodacom M-Pesa
              </label>
              <input
                type="text"
                value={formData.mpesaNumber}
                onChange={(e) => handleChange('mpesaNumber', e.target.value)}
                placeholder="+243 81..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                N° Orange Money
              </label>
              <input
                type="text"
                value={formData.orangeMoneyNumber}
                onChange={(e) => handleChange('orangeMoneyNumber', e.target.value)}
                placeholder="+243 85..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                N° Airtel Money
              </label>
              <input
                type="text"
                value={formData.airtelMoneyNumber}
                onChange={(e) => handleChange('airtelMoneyNumber', e.target.value)}
                placeholder="+243 99..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Coordonnées Bancaires (Rawbank, Equity BCDC...)
            </label>
            <input
              type="text"
              value={formData.bankDetails}
              onChange={(e) => handleChange('bankDetails', e.target.value)}
              placeholder="RAWBANK USD : 0100-... | EQUITY BCDC CDF : 0520-..."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-mono-nums"
            />
          </div>
        </div>

        {/* 5. Paramètres des Documents & Factures (Logo, Signature & Sceau / Tampon) */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
                5. Paramètres des Documents & Factures (Logo, Signature & Sceau)
              </h2>
              <p className="text-xs text-neutral-500 font-normal">
                Personnalisation visuelle des factures et devis : logo officiel, signature numérique et sceau d'entreprise pour le visa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* 5.1 Logo de l'Entreprise */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Logo de l'Entreprise</span>
                  </div>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('logoUrl', '')}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  )}
                </div>

                <div className="h-32 border-2 border-dashed border-neutral-300 rounded-lg bg-white flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo entreprise"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-neutral-400 flex flex-col items-center gap-1.5">
                      <ImageIcon className="w-8 h-8 stroke-1 text-neutral-300" />
                      <span className="text-[11px] font-medium">Aucun logo configuré</span>
                      <span className="text-[9px] text-neutral-400">PNG, JPG ou SVG (max 3 Mo)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.logoUrl ? 'Remplacer le Logo' : 'Téléverser un Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('logoUrl', e.target.files?.[0])}
                    className="hidden"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.showLogoOnInvoices !== false}
                    onChange={(e) => handleChange('showLogoOnInvoices', e.target.checked)}
                    className="rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Afficher le logo dans l'en-tête des factures</span>
                </label>
              </div>
            </div>

            {/* 5.2 Signature Autorisée */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Signature Autorisée</span>
                  </div>
                  {formData.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('signatureUrl', '')}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  )}
                </div>

                <div className="h-32 border-2 border-dashed border-neutral-300 rounded-lg bg-white flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                  {formData.signatureUrl ? (
                    <img
                      src={formData.signatureUrl}
                      alt="Signature autorisée"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-neutral-400 flex flex-col items-center gap-1.5">
                      <PenTool className="w-8 h-8 stroke-1 text-neutral-300" />
                      <span className="text-[11px] font-medium">Aucune signature configurée</span>
                      <span className="text-[9px] text-neutral-400">PNG transparent recommandé</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="py-2 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span className="truncate">Téléverser</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('signatureUrl', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateDefaultSignature}
                    className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Générer une signature manuscrite type"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate">Générer</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase">
                      Intitulé du Visa
                    </label>
                    <input
                      type="text"
                      value={formData.signatoryTitle || `Pour ${formData.name}`}
                      onChange={(e) => handleChange('signatoryTitle', e.target.value)}
                      placeholder="Ex: Pour Congo Tech SARL"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs text-neutral-900 font-medium"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.includeSignatureOnInvoicesByDefault !== false}
                      onChange={(e) => handleChange('includeSignatureOnInvoicesByDefault', e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Apposer la signature sur les factures par défaut</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 5.3 Sceau / Cachet Officiel */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Sceau / Cachet Officiel</span>
                  </div>
                  {formData.stampUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('stampUrl', '')}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  )}
                </div>

                <div className="h-32 border-2 border-dashed border-neutral-300 rounded-lg bg-white flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                  {formData.stampUrl ? (
                    <img
                      src={formData.stampUrl}
                      alt="Sceau officiel"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-neutral-400 flex flex-col items-center gap-1.5">
                      <Stamp className="w-8 h-8 stroke-1 text-neutral-300" />
                      <span className="text-[11px] font-medium">Aucun sceau configuré</span>
                      <span className="text-[9px] text-neutral-400">Tampon circulaire ou rectangulaire</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="py-2 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span className="truncate">Téléverser</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('stampUrl', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateDefaultStamp}
                    className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Générer automatiquement un sceau officiel circulaire RDC"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">Générer Sceau</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 uppercase">
                      Nom / Titre du Signataire
                    </label>
                    <input
                      type="text"
                      value={formData.signatoryName || 'La Gérance / Direction Générale'}
                      onChange={(e) => handleChange('signatoryName', e.target.value)}
                      placeholder="Ex: La Gérance / Direction Générale"
                      className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs text-neutral-900 font-medium"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.includeStampOnInvoicesByDefault !== false}
                      onChange={(e) => handleChange('includeStampOnInvoicesByDefault', e.target.checked)}
                      className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Apposer le sceau sur les factures par défaut</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 5.4 Cachet PAYÉ CASH (Paiements Comptant & Espèces) */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider">Cachet "PAYÉ CASH"</span>
                  </div>
                  {formData.cashPaidStampUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('cashPaidStampUrl', '')}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  )}
                </div>

                <div className="h-32 border-2 border-dashed border-neutral-300 rounded-lg bg-white flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                  {formData.cashPaidStampUrl ? (
                    <img
                      src={formData.cashPaidStampUrl}
                      alt="Cachet Payé Cash"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-neutral-400 flex flex-col items-center gap-1.5">
                      <Banknote className="w-8 h-8 stroke-1 text-neutral-300" />
                      <span className="text-[11px] font-medium">Aucun cachet cash configuré</span>
                      <span className="text-[9px] text-neutral-400">Tampon "PAYÉ CASH" encre rouge</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <label className="py-2 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span className="truncate">Téléverser</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('cashPaidStampUrl', e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateCashPaidStamp}
                    className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Générer automatiquement un tampon officiel PAYÉ CASH"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    <span className="truncate">Générer Cachet</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-start gap-2 text-xs text-neutral-700 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.includeCashPaidStampByDefault !== false}
                      onChange={(e) => handleChange('includeCashPaidStampByDefault', e.target.checked)}
                      className="rounded border-neutral-300 text-rose-600 focus:ring-rose-500 mt-0.5 shrink-0"
                    />
                    <span className="leading-tight">
                      Apposer automatiquement le Cachet PAYÉ CASH sur les factures et reçus réglés en Espèces (Cash)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Print & Automatic PDF Export (C:\hibtech) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                Impression Directe & Sauvegarde PDF Automatique (Dossier C:\hibtech)
              </h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Lors de l'appui sur <strong className="font-bold">Imprimer</strong>, le document est envoyé sans délai à l'imprimante par défaut de votre ordinateur, le fichier PDF haute résolution est immédiatement téléchargé pour être archivé dans le dossier cible, et la fenêtre se referme automatiquement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                  Dossier Racine d'Exportation PDF
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.pdfExportPath || 'C:\\hibtech'}
                    onChange={(e) => handleChange('pdfExportPath', e.target.value)}
                    placeholder="C:\hibtech"
                    className="w-full bg-white border border-neutral-300 rounded-lg pl-3 pr-24 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2 top-2 text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                    Racine Locale
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Astuce navigateur : pour que vos téléchargements aillent directement dans ce dossier sans invite de confirmation, configurez le dossier de téléchargement de Google Chrome ou Microsoft Edge sur <code className="font-mono bg-neutral-100 px-1 py-0.2 rounded font-bold">C:\hibtech</code>.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoDownloadPdfOnPrint !== false}
                    onChange={(e) => handleChange('autoDownloadPdfOnPrint', e.target.checked)}
                    className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="font-medium">Télécharger immédiatement le PDF lors du clic sur Imprimer</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoCloseModalOnPrint !== false}
                    onChange={(e) => handleChange('autoCloseModalOnPrint', e.target.checked)}
                    className="rounded border-neutral-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="font-medium">Fermer automatiquement la fenêtre d'impression dès l'envoi</span>
                </label>
              </div>
            </div>
          </div>

          {/* Mentions de bas de page de la facture */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Mentions Légales & Commerciales de Bas de Facture (Footer)
            </label>
            <textarea
              rows={2}
              value={formData.invoiceFooterNotes || ''}
              onChange={(e) => handleChange('invoiceFooterNotes', e.target.value)}
              placeholder="Ex: Merci pour votre confiance. Les marchandises vendues ne sont ni reprises ni échangées après 48h. Pour toute assistance, contactez le service client."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-3 text-neutral-900 focus:outline-none focus:bg-white text-xs"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="h-10 px-6 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Enregistrer Tous les Paramètres</span>
          </button>
        </div>
      </form>

      {/* 6. Sauvegarde & Démonstration */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
            6. Sauvegarde & Restauration des Données Fiscales
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {/* Export SYSCOHADA */}
          <button
            type="button"
            onClick={() => exportSyscohadaJournal(sales, expenses, settings, settings.exchangeRateUSD_CDF || 2850)}
            className="h-9 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs shrink-0"
            title="Exporter le Journal Comptable Conforme SYSCOHADA (Ventes, Caisse, Balance)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Journal Comptable SYSCOHADA (.xlsx)</span>
          </button>

          {/* Audit Trail Button */}
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-2xs shrink-0"
            title="Consulter le journal d'audit de sécurité des opérations sensibles"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Journal d'Audit des Actions Sensibles</span>
          </button>

          <button
            type="button"
            onClick={handleExportMasterExcel}
            className="h-9 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors border border-neutral-300 shrink-0"
            title="Exporter l'intégralité de l'entreprise (Factures, Stock, Clients, Dépenses, Équipements) dans un fichier Excel multi-feuilles"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Grand Livre Excel Global</span>
          </button>

          <button
            type="button"
            onClick={exportDatabaseJSON}
            className="h-9 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors border border-neutral-300 shrink-0"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Sauvegarde JSON</span>
          </button>

          <label className="h-9 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors border border-neutral-300 cursor-pointer shrink-0">
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Restaurer JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setIsDataWipeModalOpen(true)}
            className="h-9 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors border border-rose-200 sm:ml-auto shrink-0"
            title="Ouvrir les options de réinitialisation ou suppression des données"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Réinitialiser Données Démo DGI RDC</span>
          </button>
        </div>
      </div>

      {/* 7. Zone Danger : Suppression & Purge des Données */}
      <div className="bg-rose-50/70 p-6 rounded-xl border-2 border-rose-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-rose-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-rose-950 text-sm uppercase tracking-wider flex items-center gap-2">
                <span>7. Suppression & Purge des Données de l'Application</span>
                <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Zone Sensible
                </span>
              </h2>
              <p className="text-xs text-rose-800 mt-0.5">
                Purger les factures/ventes de test, vider les données de démonstration ou réinitialiser complètement l'application pour démarrer la production.
              </p>
            </div>
          </div>
        </div>

        {/* Database state indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
            <span className="block text-base font-black text-rose-950 font-mono-nums">{sales.length}</span>
            <span className="text-[11px] text-neutral-600">Ventes & Factures</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
            <span className="block text-base font-black text-rose-950 font-mono-nums">{products.length}</span>
            <span className="text-[11px] text-neutral-600">Articles Stock</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
            <span className="block text-base font-black text-rose-950 font-mono-nums">{clients.length}</span>
            <span className="text-[11px] text-neutral-600">Clients</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
            <span className="block text-base font-black text-rose-950 font-mono-nums">{expenses.length}</span>
            <span className="text-[11px] text-neutral-600">Dépenses</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="block text-base font-black text-rose-950 font-mono-nums">{equipments.length}</span>
            <span className="text-[11px] text-neutral-600">Équipements</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsDataWipeModalOpen(true)}
            className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-98 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer les Données de l'Application...</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDataWipeModalOpen(true)}
            className="h-10 px-4 bg-white hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors border border-rose-300 shadow-2xs shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Purger Seules les Transactions / Reset Usine</span>
          </button>
        </div>
      </div>

      {/* Audit Trail Modal */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};
