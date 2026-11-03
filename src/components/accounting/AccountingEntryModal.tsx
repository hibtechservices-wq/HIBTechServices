import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SyscohadaJournalCode } from '../../types';
import { syscohadaChartOfAccounts } from '../../data/syscohadaChart';
import { X, Check, Calculator, AlertTriangle, BookOpen } from 'lucide-react';

interface AccountingEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AccountingEntryModal: React.FC<AccountingEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addAccountingEntry, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [journal, setJournal] = useState<SyscohadaJournalCode>('OD');
  const [pieceRef, setPieceRef] = useState<string>(`OD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [description, setDescription] = useState<string>('');

  // Ligne Débit
  const [debitAccount, setDebitAccount] = useState<string>('605000');
  // Ligne Crédit
  const [creditAccount, setCreditAccount] = useState<string>('571100');

  const [amountUSD, setAmountUSD] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const debitAccInfo = syscohadaChartOfAccounts.find((a) => a.accountNumber === debitAccount);
  const creditAccInfo = syscohadaChartOfAccounts.find((a) => a.accountNumber === creditAccount);
  const amountCDF = Math.round((amountUSD || 0) * rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Veuillez saisir un libellé clair pour l'opération comptable.");
      return;
    }
    if (!amountUSD || amountUSD <= 0) {
      setError('Le montant doit être supérieur à 0.');
      return;
    }
    if (debitAccount === creditAccount) {
      setError('Le compte au débit doit être différent du compte au crédit.');
      return;
    }

    const journalLabels: Record<SyscohadaJournalCode, string> = {
      VT: 'Ventes',
      CA: 'Trésorerie',
      ACH: 'Achats & Dépenses',
      OD: 'Opérations Diverses',
      BQ: 'Banque',
    };

    // 1. Écriture Débit
    addAccountingEntry({
      date,
      journal,
      journalLabel: journalLabels[journal] || 'Opérations Diverses',
      pieceRef: pieceRef.trim(),
      accountNumber: debitAccount,
      accountLabel: debitAccInfo?.label || `Compte ${debitAccount}`,
      description: description.trim(),
      debitUSD: amountUSD,
      creditUSD: 0,
      debitCDF: amountCDF,
      creditCDF: 0,
      exchangeRate: rate,
      sourceType: 'MANUAL_OD',
      isCustom: true,
    });

    // 2. Écriture Crédit (garantit l'égalité stricte Débit = Crédit)
    addAccountingEntry({
      date,
      journal,
      journalLabel: journalLabels[journal] || 'Opérations Diverses',
      pieceRef: pieceRef.trim(),
      accountNumber: creditAccount,
      accountLabel: creditAccInfo?.label || `Compte ${creditAccount}`,
      description: description.trim(),
      debitUSD: 0,
      creditUSD: amountUSD,
      debitCDF: 0,
      creditCDF: amountCDF,
      exchangeRate: rate,
      sourceType: 'MANUAL_OD',
      isCustom: true,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm uppercase tracking-wide">
                Nouvelle Écriture Comptable (SYSCOHADA)
              </h2>
              <p className="text-[11px] text-neutral-400">
                Saisie en partie double · Équilibre Débit = Crédit garanti
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Date, Journal & Pièce */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Date d'effet :
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Journal :
              </label>
              <select
                value={journal}
                onChange={(e) => setJournal(e.target.value as SyscohadaJournalCode)}
                className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
              >
                <option value="OD">OD - Opérations Diverses</option>
                <option value="VT">VT - Journal des Ventes</option>
                <option value="ACH">ACH - Journal des Dépenses/Achats</option>
                <option value="CA">CA - Caisse & Encaissements</option>
                <option value="BQ">BQ - Journal de Banque</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                N° Pièce Réf :
              </label>
              <input
                type="text"
                required
                value={pieceRef}
                onChange={(e) => setPieceRef(e.target.value)}
                placeholder="Ex: OD-2026-001"
                className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-mono font-bold text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Libellé de l'opération */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Libellé de l'opération comptable :
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Dotation aux amortissements matériel, régularisation d'inventaire, apport en compte courant..."
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:bg-white focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {/* Row 3: Partie Double (Débit & Crédit) */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block">
              Imputation Comptable SYSCOHADA :
            </span>

            {/* Compte Débité */}
            <div>
              <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                1. Compte à Débiter (+) :
              </label>
              <select
                value={debitAccount}
                onChange={(e) => setDebitAccount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono text-neutral-900 focus:border-emerald-600 focus:outline-none"
              >
                {syscohadaChartOfAccounts.map((acc) => (
                  <option key={`deb-${acc.accountNumber}`} value={acc.accountNumber}>
                    {acc.accountNumber} - {acc.label} (Classe {acc.accountClass})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-neutral-500 block mt-0.5">
                {debitAccInfo?.description || 'Compte de charge ou d’actif'}
              </span>
            </div>

            {/* Compte Crédité */}
            <div>
              <label className="block text-[11px] font-semibold text-blue-800 mb-1">
                2. Compte à Créditer (-) :
              </label>
              <select
                value={creditAccount}
                onChange={(e) => setCreditAccount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono text-neutral-900 focus:border-blue-600 focus:outline-none"
              >
                {syscohadaChartOfAccounts.map((acc) => (
                  <option key={`cred-${acc.accountNumber}`} value={acc.accountNumber}>
                    {acc.accountNumber} - {acc.label} (Classe {acc.accountClass})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-neutral-500 block mt-0.5">
                {creditAccInfo?.description || 'Compte de produit, passif ou trésorerie'}
              </span>
            </div>
          </div>

          {/* Row 4: Montant & Conversion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-neutral-100/70 rounded-xl border border-neutral-200">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Montant ($ USD) :
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={amountUSD || ''}
                  onChange={(e) => setAmountUSD(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-bold font-mono-nums text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                  USD
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Contre-valeur (Franc Congolais CDF) :
              </label>
              <div className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-bold font-mono-nums text-neutral-800 flex items-center justify-between">
                <span>{amountCDF.toLocaleString('fr-FR')} FC</span>
                <span className="text-[10px] text-neutral-400 font-sans font-normal">
                  (Taux: {rate.toLocaleString()} FC)
                </span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Valider l'Écriture (Débit = Crédit)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
