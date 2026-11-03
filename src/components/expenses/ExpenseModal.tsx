import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod } from '../../types';
import { getPaymentMethodLabel, formatDualCurrency } from '../../utils/formatters';
import { DollarSign, X, Check, Tag } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('ELECTRICITE_CARBURANT');
  const [amountUSD, setAmountUSD] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_USD');
  const [beneficiary, setBeneficiary] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amountUSD <= 0) return;

    addExpense({
      description,
      category,
      amountUSD,
      amountCDF: Math.round(amountUSD * rate),
      exchangeRate: rate,
      paymentMethod,
      beneficiary: beneficiary.trim() || undefined,
      receiptRef: receiptRef.trim() || undefined,
      recordedBy: settings.cashierName || 'Responsable',
      date: new Date(date).toISOString(),
    });

    onClose();
  };

  const categories: { key: ExpenseCategory; label: string }[] = [
    { key: 'ELECTRICITE_CARBURANT', label: 'Carburant Groupe & Énergie (SNEL)' },
    { key: 'LOYER', label: 'Loyer Bureau & Showroom' },
    { key: 'COMMUNICATION', label: 'Internet Fibre & Téléphone (Vodacom/Orange)' },
    { key: 'TRANSPORT', label: 'Transport, Logistique & Dédouanement' },
    { key: 'SALAIRES', label: 'Salaires & Rémunérations Personnel' },
    { key: 'FOURNITURES', label: 'Fournitures de bureau & Consommables' },
    { key: 'IMPOTS_TAXES', label: 'Taxes, DGI, DGRAD, DGM, Commune' },
    { key: 'MAINTENANCE', label: 'Entretien locaux & Véhicules' },
    { key: 'AUTRES', label: 'Autres Charges d\'Exploitation' },
  ];

  const paymentMethods: PaymentMethod[] = [
    'CASH_USD',
    'CASH_CDF',
    'MPESA',
    'ORANGE_MONEY',
    'AIRTEL_MONEY',
    'AFRIMONEY',
    'BANK_TRANSFER',
  ];

  const dualAmount = formatDualCurrency(amountUSD || 0, rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-semibold text-neutral-900">Enregistrer une Dépense / Charge</h3>
              <p className="text-xs text-neutral-500">Suivi des coûts d'exploitation et calcul du bénéfice net</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Catégorie de Dépense *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs font-medium"
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Motif / Description de la dépense *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: 50L Mazout station TotalEnergies pour groupe"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Montant ($ USD) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(Number(e.target.value))}
                  className="w-full font-mono-nums font-bold text-base bg-neutral-50 border border-neutral-300 rounded-lg pl-8 pr-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                  required
                />
                <DollarSign className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[11px] font-mono-nums text-neutral-500 mt-1 block">
                ≈ {dualAmount.cdf}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Date de la Dépense
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Mode de Paiement
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
              >
                {paymentMethods.map((m) => {
                  const info = getPaymentMethodLabel(m);
                  return (
                    <option key={m} value={m}>
                      {info.label} ({info.provider})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Bénéficiaire / Fournisseur
              </label>
              <input
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="Ex: TotalEnergies, Propriétaire..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              N° Pièce justificative / Reçu (Optionnel)
            </label>
            <input
              type="text"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              placeholder="Ex: FACT-FOURN-0928"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs font-mono-nums"
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs font-bold"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>Enregistrer la Charge</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
