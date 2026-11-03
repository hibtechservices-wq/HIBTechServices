import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { formatDualCurrency } from '../../utils/formatters';
import {
  FileText,
  X,
  User,
  Calendar,
  Building,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Plus,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PosProformaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  cartSubtotalUSD: number;
  cartTaxAmountUSD: number;
  cartTotalUSD: number;
  initialClientId?: string;
  initialVatEnabled?: boolean;
  onSuccess: () => void;
}

export const PosProformaModal: React.FC<PosProformaModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  cartSubtotalUSD,
  cartTaxAmountUSD,
  cartTotalUSD,
  initialClientId = 'comptoir',
  initialVatEnabled,
  onSuccess,
}) => {
  const { clients, addClient, createSale, setActivePrintSale, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId);
  const [isCreatingNewClient, setIsCreatingNewClient] = useState<boolean>(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientNif, setNewClientNif] = useState('');

  const [validityDays, setValidityDays] = useState<number>(30);
  const [customDiscountUSD, setCustomDiscountUSD] = useState<number>(0);
  const [isVatActive, setIsVatActive] = useState<boolean>(
    initialVatEnabled !== undefined
      ? initialVatEnabled
      : Boolean(settings.dgiIsVatSubject && settings.enableTaxByDefault)
  );

  useEffect(() => {
    if (isOpen) {
      setIsVatActive(
        initialVatEnabled !== undefined
          ? initialVatEnabled
          : Boolean(settings.dgiIsVatSubject && settings.enableTaxByDefault)
      );
    }
  }, [isOpen, initialVatEnabled, settings.dgiIsVatSubject, settings.enableTaxByDefault]);

  const [proformaNotes, setProformaNotes] = useState<string>(
    'Offre de prix valable 30 jours. Disponibilité sous réserve des stocks au moment de la commande ferme.'
  );

  if (!isOpen) return null;

  const effectiveSubtotal = Math.max(0, cartSubtotalUSD - customDiscountUSD);
  const effectiveTax = isVatActive
    ? cartItems.filter(i => i.taxGroup === 'A').reduce((sum, it) => sum + (it.subtotalUSD * ((settings.taxPercent || 16) / 100)), 0)
    : 0;
  const effectiveTotalUSD = effectiveSubtotal + effectiveTax;
  const dualTotal = formatDualCurrency(effectiveTotalUSD, rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalClientId = selectedClientId;

    // If cashier entered a new client inline
    if (isCreatingNewClient && newClientName.trim()) {
      const created = addClient({
        name: newClientName.trim(),
        companyName: newClientCompany.trim() || undefined,
        phone: newClientPhone.trim() || '+243 00 000 0000',
        nif: newClientNif.trim() || undefined,
        city: 'Lubumbashi',
        type: newClientCompany.trim() ? 'COMPANY' : 'INDIVIDUAL',
      });
      finalClientId = created.id;
    }

    // Due date = today + validityDays
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + validityDays);

    const proformaSale = createSale({
      type: 'QUOTE_PROFORMA',
      clientId: finalClientId,
      items: cartItems.map((i) => ({
        itemId: i.itemId,
        name: i.name,
        code: i.code,
        type: i.type,
        unit: i.unit,
        quantity: i.quantity,
        unitPriceUSD: i.unitPriceUSD,
        unitCostPriceUSD: i.unitCostPriceUSD,
        subtotalUSD: i.subtotalUSD,
        taxGroup: i.taxGroup || 'A',
        taxRate: i.taxRate || 16,
        taxAmountUSD: i.taxAmountUSD || 0,
      })),
      discountUSD: customDiscountUSD,
      taxPercent: isVatActive ? (settings.taxPercent || 16) : 0,
      amountPaidUSD: 0,
      paymentMethod: 'BANK_TRANSFER',
      dueDate: dueDate.toISOString(),
      notes: proformaNotes.trim() || undefined,
      isNormalizedDGI: false,
    });

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    onSuccess();
    onClose();

    // Immediately open print/preview modal for A4 Proforma Invoice
    setActivePrintSale(proformaSale);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                Établir une Facture Proforma
              </h3>
              <p className="text-xs text-blue-200">
                Génération immédiate d'un devis / offre de prix officielle (USD & CDF)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Summary Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider block">
                Articles du panier ({cartItems.length} références)
              </span>
              <p className="text-xs text-blue-800 mt-0.5">
                Ces articles composeront la proposition commerciale proforma.
              </p>
            </div>
            <div className="text-right sm:shrink-0 bg-white px-3 py-1.5 rounded-lg border border-blue-200">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Montant Proforma TTC</span>
              <span className="text-base font-bold text-neutral-900 font-mono-nums block">{dualTotal.usd}</span>
              <span className="text-[11px] text-blue-700 font-semibold font-mono-nums block">{dualTotal.cdf}</span>
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Destinataire / Client de la Proforma *
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                {isCreatingNewClient ? '← Choisir un client existant' : '+ Nouveau Client Express'}
              </button>
            </div>

            {!isCreatingNewClient ? (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="comptoir">Client Comptoir (Consommateur Final)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.phone} {c.nif ? `[NIF: ${c.nif}]` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Nom du Contact / Représentant *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Ex: M. Jean-Pierre Kalonji"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Entreprise / Organisation (facultatif)
                    </label>
                    <input
                      type="text"
                      value={newClientCompany}
                      onChange={(e) => setNewClientCompany(e.target.value)}
                      placeholder="Ex: Groupe BCDC Rawbank SARL"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Numéro Téléphone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="+243 81 234 5678"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      NIF / RCCM du Client (Fiscalité)
                    </label>
                    <input
                      type="text"
                      value={newClientNif}
                      onChange={(e) => setNewClientNif(e.target.value)}
                      placeholder="Ex: A1209841B"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-600 font-mono-nums"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validity & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Durée de Validité de l'Offre
              </label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>7 jours (1 semaine)</option>
                <option value={15}>15 jours (2 semaines)</option>
                <option value={30}>30 jours (1 mois - Recommandé)</option>
                <option value={60}>60 jours (2 mois)</option>
                <option value={90}>90 jours (3 mois)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                Remise Commerciale Exceptionnelle ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={customDiscountUSD || ''}
                onChange={(e) => setCustomDiscountUSD(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-nums"
              />
            </div>
          </div>

          {/* Notes and Terms */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
              Conditions Particulières & Notes de la Proforma
            </label>
            <textarea
              rows={2}
              value={proformaNotes}
              onChange={(e) => setProformaNotes(e.target.value)}
              placeholder="Ex: Modalités de paiement, délais de livraison à Lubumbashi ou en provinces..."
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* TVA Option Toggle */}
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isVatActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-800 block">TVA ({settings.taxPercent || 16}%)</span>
                <span className="text-[10px] text-neutral-500">
                  {isVatActive ? "Calcul standard de TVA 16% inclus dans l'offre proforma" : "TVA désactivée (Devis proforma généré hors taxe / exonéré)"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsVatActive(!isVatActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                isVatActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-neutral-300 hover:bg-neutral-400 text-neutral-800'
              }`}
            >
              {isVatActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>TVA Active (16%)</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Désactivée (0%)</span>
                </>
              )}
            </button>
          </div>

          {/* Financial Recapitulation */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-1.5 font-mono-nums text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Sous-total Brut HT :</span>
              <span>${cartSubtotalUSD.toFixed(2)}</span>
            </div>
            {customDiscountUSD > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Remise accordée :</span>
                <span>-${customDiscountUSD.toFixed(2)}</span>
              </div>
            )}
            {isVatActive ? (
              <div className="flex justify-between text-neutral-600">
                <span>TVA RDC ({settings.taxPercent || 16}%) légale :</span>
                <span className="font-semibold text-emerald-800">+${effectiveTax.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-neutral-500 italic text-[11px]">
                <span>TVA :</span>
                <span className="font-sans not-italic font-medium text-[10px] bg-neutral-200/80 text-neutral-700 px-1.5 py-0.5 rounded">
                  Désactivée (0% Hors Taxe)
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-neutral-900 pt-2 border-t border-neutral-200">
              <span>TOTAL PROFORMA ($ USD) :</span>
              <span className="text-blue-900">{dualTotal.usd}</span>
            </div>
            <div className="flex justify-between font-bold text-neutral-900 bg-amber-100/70 px-2.5 py-1 rounded text-xs">
              <span>Équivalent en Francs Congolais (CDF) :</span>
              <span>{dualTotal.cdf}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-semibold text-xs transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Générer la Facture Proforma & Imprimer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
