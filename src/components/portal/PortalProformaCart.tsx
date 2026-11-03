import React, { useState } from 'react';
import { PortalCartItem, Client, ProductOrService, Sale, Currency } from '../../types';
import { formatDualCurrency } from '../../utils/formatters';
import {
  FileText,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Phone,
  Sparkles,
  Printer,
  Download,
  Share2,
  Layers,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortalProformaCartProps {
  cart: PortalCartItem[];
  exchangeRate: number;
  currency?: Currency;
  portalClient: Client | null;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOpenCatalog: () => void;
  onOpenAuthModal: () => void;
  onGenerateProforma: (params: {
    notes?: string;
    validityDays?: number;
    isVatActive?: boolean;
    guestName?: string;
    guestCompany?: string;
    guestPhone?: string;
  }) => Sale | null;
  onViewPrintSale: (sale: Sale) => void;
}

export const PortalProformaCart: React.FC<PortalProformaCartProps> = ({
  cart,
  exchangeRate,
  currency = 'USD',
  portalClient,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCatalog,
  onOpenAuthModal,
  onGenerateProforma,
  onViewPrintSale,
}) => {
  const [validityDays, setValidityDays] = useState<number>(30);
  const [isVatActive, setIsVatActive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Guest fields if client not logged in
  const [guestName, setGuestName] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);

  // Subtotals calculation
  const subtotalHT_USD = cart.reduce((sum, ci) => sum + (ci.item.priceUSD * ci.quantity), 0);
  const taxGroupABase = cart
    .filter((ci) => ci.item.taxGroup === 'A')
    .reduce((sum, ci) => sum + (ci.item.priceUSD * ci.quantity), 0);

  const tva16_USD = isVatActive ? (taxGroupABase * 0.16) : 0;
  const totalTTC_USD = subtotalHT_USD + tva16_USD;

  const dualHT = formatDualCurrency(subtotalHT_USD, exchangeRate);
  const dualTVA = formatDualCurrency(tva16_USD, exchangeRate);
  const dualTotal = formatDualCurrency(totalTTC_USD, exchangeRate);

  const totalItemsCount = cart.reduce((s, ci) => s + ci.quantity, 0);

  const handleGenerate = () => {
    setGuestError(null);

    // If client is not logged in, ensure at least guest name and phone are filled
    if (!portalClient) {
      if (!guestName.trim()) {
        setGuestError('Veuillez renseigner votre nom pour établir le devis proforma.');
        return;
      }
      if (!guestPhone.trim() || guestPhone.trim().length < 5) {
        setGuestError('Veuillez renseigner un numéro de téléphone pour la réception du devis.');
        return;
      }
    }

    const createdSale = onGenerateProforma({
      notes: notes.trim() || undefined,
      validityDays,
      isVatActive,
      guestName: guestName.trim() || undefined,
      guestCompany: guestCompany.trim() || undefined,
      guestPhone: guestPhone.trim() || undefined,
    });

    if (createdSale) {
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
      onViewPrintSale(createdSale);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-14 text-center border border-dashed border-neutral-300 max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <ShoppingCart className="w-8 h-8 text-neutral-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-900">
            Votre Panier Proforma est vide
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Sélectionnez des matériels ou prestations dans notre catalogue pour composer votre devis proforma en ligne.
          </p>
        </div>
        <button
          onClick={onOpenCatalog}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 mx-auto"
        >
          <Layers className="w-4 h-4" />
          <span>Parcourir le Catalogue en Image</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left 2 Columns: Items List & Proforma Details */}
      <div className="lg:col-span-2 space-y-5">
        {/* Cart Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Mon Panier Proforma ({totalItemsCount} article{totalItemsCount > 1 ? 's' : ''})
              </h2>
              <p className="text-xs text-neutral-500">
                Ajustez les quantités et vérifiez vos articles avant de générer votre devis officiel.
              </p>
            </div>
          </div>

          <button
            onClick={onClearCart}
            className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold"
            title="Vider le panier"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vider le panier</span>
          </button>
        </div>

        {/* Items Table / Cards */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {cart.map(({ item, quantity }) => {
              const safeUnitPrice = Number(item.priceUSD) || 0;
              const lineTotal = safeUnitPrice * quantity;
              const lineDual = formatDualCurrency(lineTotal, exchangeRate);
              const unitDual = formatDualCurrency(safeUnitPrice, exchangeRate);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                >
                  {/* Thumbnail & Description */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-neutral-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mb-0.5">
                        <span className="font-mono bg-neutral-100 px-1.5 py-0.2 rounded font-semibold">
                          {item.code}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-neutral-700">{item.brand || item.category}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug line-clamp-1">
                        {item.name}
                      </h4>
                      <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-800">Sur devis officiel</span>
                        <span>•</span>
                        <span>Unité : {item.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Modifier & Line Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    {/* Stepper */}
                    <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Diminuer la quantité"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-bold text-xs text-neutral-900 py-1 font-mono-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Augmenter la quantité"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal notice */}
                    <div className="text-right min-w-[95px]">
                      <div className="text-xs font-bold text-neutral-800">
                        Sur devis
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {quantity} {item.unit}{quantity > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer cet article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-neutral-50/70 border-t border-neutral-200/80 flex items-center justify-between">
            <button
              onClick={onOpenCatalog}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter d'autres articles du catalogue</span>
            </button>
            <span className="text-xs text-neutral-500 font-medium">
              Offre chiffrée établie sur devis proforma
            </span>
          </div>
        </div>

        {/* Proforma Conditions & Notes Box */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Paramètres & Conditions du Devis Proforma
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Validity Duration */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Durée de Validité de l'Offre
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 60].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setValidityDays(days)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      validityDays === days
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {days} Jours
                  </button>
                ))}
              </div>
            </div>

            {/* TVA Toggle */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                TVA Régime DGI RDC (16%)
              </label>
              <button
                type="button"
                onClick={() => setIsVatActive(!isVatActive)}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-between transition-all ${
                  isVatActive
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                }`}
              >
                <span>TVA 16% Normalisée</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${isVatActive ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                  {isVatActive ? 'Active (+16%)' : 'Exonérée (HT)'}
                </span>
              </button>
            </div>
          </div>

          {/* Notes or Instructions */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Instructions Spécifiques / Lieu de Livraison / Remarques (Optionnel)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Livraison requise au bureau central, installation réseau le week-end, besoin de formation..."
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Client Identity & Financial Summary */}
      <div className="space-y-5">
        {/* Client Identity Card */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              Destinataire du Devis
            </h3>
            {portalClient ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Compte Connecté
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                Connexion
              </button>
            )}
          </div>

          {portalClient ? (
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1.5 text-xs">
              <div className="font-bold text-neutral-900 text-sm">
                {portalClient.name}
              </div>
              {portalClient.companyName && (
                <div className="text-neutral-700 font-semibold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-neutral-400" />
                  {portalClient.companyName}
                </div>
              )}
              <div className="text-neutral-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                {portalClient.phone}
              </div>
              {portalClient.address && (
                <div className="text-neutral-500 text-[11px]">
                  {portalClient.address}, {portalClient.city}
                </div>
              )}
              {portalClient.nif && (
                <div className="text-[10px] font-mono text-neutral-500">
                  NIF : {portalClient.nif}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                <p className="font-semibold">
                  Vous n'êtes pas encore connecté à votre compte client.
                </p>
                <p className="text-[11px] text-amber-800">
                  Renseignez vos coordonnées ci-dessous pour établir votre devis, ou connectez-vous :
                </p>
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors inline-block mt-1"
                >
                  Se Connecter / Créer un Compte
                </button>
              </div>

              {guestError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                  <span>{guestError}</span>
                </div>
              )}

              {/* Inline Guest Inputs */}
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                    Nom / Raison Sociale <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                    Entreprise (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={guestCompany}
                    onChange={(e) => setGuestCompany(e.target.value)}
                    placeholder="Nom de votre société"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                    Téléphone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+243 81 000 0000"
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proforma Request Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Récapitulatif de votre Demande
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-neutral-600">Nombre d'articles sélectionnés</span>
              <span className="font-bold text-neutral-900 font-mono-nums">{totalItemsCount} article{totalItemsCount > 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-neutral-600">Régime fiscal</span>
              <span className="font-semibold text-neutral-800">
                {isVatActive ? 'TVA 16% incluse au devis' : 'Hors champ TVA (Exonéré)'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-neutral-600">Validité de l'offre</span>
              <span className="font-semibold text-neutral-800">{validityDays} jours</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Tarification sur Devis Officiel
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Le montant total et les conditions tarifaires seront établis sur votre devis proforma officiel avec cachet et signature de la direction.
              </p>
            </div>
          </div>

          {/* Guarantee / Legal note */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-[11px] text-neutral-600 space-y-1">
            <div className="font-bold text-neutral-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Document officiel avec cachet & signature
            </div>
            <p className="leading-tight">
              Ce devis proforma est téléchargeable immédiatement en PDF haute définition, imprimable au format A4 et certifié par notre direction.
            </p>
          </div>

          {/* Action Button: Generate Proforma */}
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>Valider & Générer ma Facture Proforma</span>
          </button>
        </div>
      </div>
    </div>
  );
};
