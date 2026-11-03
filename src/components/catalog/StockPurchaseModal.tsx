import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductOrService, PaymentMethod } from '../../types';
import { formatDualCurrency } from '../../utils/formatters';
import {
  Package,
  Plus,
  Trash2,
  X,
  Truck,
  Check,
  Calculator,
  ArrowRight,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface StockPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PurchaseLine {
  productId: string;
  quantity: number;
  unitCostUSD: number;
}

export const StockPurchaseModal: React.FC<StockPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { products, recordStockPurchase, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  // Header fields
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [blReference, setBlReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_USD');
  const [notes, setNotes] = useState('');

  // Purchase items
  const physicalProducts = products.filter((p) => p.type === 'PRODUCT' && p.isActive);

  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      productId: physicalProducts[0]?.id || '',
      quantity: 1,
      unitCostUSD: physicalProducts[0]?.costPriceUSD || 0,
    },
  ]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    const defaultProd = physicalProducts[0];
    if (!defaultProd) return;
    setLines([
      ...lines,
      {
        productId: defaultProd.id,
        quantity: 1,
        unitCostUSD: defaultProd.costPriceUSD || 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: keyof PurchaseLine, value: any) => {
    const updated = [...lines];
    if (field === 'productId') {
      const prod = physicalProducts.find((p) => p.id === value);
      updated[index] = {
        productId: value,
        quantity: updated[index].quantity,
        unitCostUSD: prod?.costPriceUSD || 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLines(updated);
  };

  // Total cost calculation
  const totalCostUSD = lines.reduce((acc, l) => acc + (l.quantity * l.unitCostUSD), 0);
  const totalCostCDF = Math.round(totalCostUSD * rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Veuillez renseigner le nom du fournisseur');
      return;
    }

    const validItems = lines.filter((l) => l.productId && l.quantity > 0);
    if (validItems.length === 0) {
      alert('Veuillez ajouter au moins un article avec une quantité supérieure à 0');
      return;
    }

    recordStockPurchase({
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim() || undefined,
      blReference: blReference.trim() || undefined,
      items: validItems.map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitCostUSD: Number(l.unitCostUSD),
      })),
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                Réception Arrivage & Entrée en Stock Fournisseur
              </h2>
              <p className="text-[11px] text-neutral-400">
                Approvisionnement, calcul automatique CMUP / PUMP et valorisation du stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section Fournisseur & Bon de livraison */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>Informations Fournisseur & Justificatif</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Nom du Fournisseur *
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ex : MCS SARL, Cisco RDC, import Dubaï..."
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  N° Bon de Livraison / Facture BL
                </label>
                <input
                  type="text"
                  value={blReference}
                  onChange={(e) => setBlReference(e.target.value)}
                  placeholder="Ex : BL-2026-4491, FAC-SUP-88"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Téléphone / WhatsApp Fournisseur
                </label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="+243 81 000 0000"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Section Articles Réceptionnés & Calcul CMUP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Marchandises Reçues & Coût Unitaire Pondéré (CMUP)</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Le système met à jour automatiquement la valeur réelle du stock en magasin
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, idx) => {
                const prod = physicalProducts.find((p) => p.id === line.productId);
                const currentStock = prod ? prod.stockQty : 0;
                const oldCost = prod ? prod.costPriceUSD : 0;
                const addedQty = Number(line.quantity) || 0;
                const newCost = Number(line.unitCostUSD) || 0;
                const newTotalQty = currentStock + addedQty;

                // Live CMUP preview
                const calculatedCMUP = newTotalQty > 0
                  ? ((currentStock * oldCost) + (addedQty * newCost)) / newTotalQty
                  : newCost;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/90 space-y-2"
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Product Selector */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-0.5">
                          Article
                        </label>
                        <select
                          value={line.productId}
                          onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                        >
                          {physicalProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code}) — Stock: {p.stockQty} {p.unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Received */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-0.5">
                          Qté Reçue (+)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => handleUpdateLine(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold font-mono text-neutral-900 text-center"
                        />
                      </div>

                      {/* Unit Cost USD */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-0.5">
                          Coût Achat ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitCostUSD}
                          onChange={(e) => handleUpdateLine(idx, 'unitCostUSD', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold font-mono text-neutral-900 text-right"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="col-span-3 sm:col-span-2 text-right">
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase mb-0.5">
                          Sous-total
                        </label>
                        <span className="text-xs font-bold font-mono text-neutral-900 block leading-tight">
                          ${(line.quantity * line.unitCostUSD).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono block">
                          {Math.round((line.quantity * line.unitCostUSD) * rate).toLocaleString()} FC
                        </span>
                      </div>

                      {/* Delete Line */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={lines.length <= 1}
                          onClick={() => handleRemoveLine(idx)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            lines.length > 1
                              ? 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-neutral-200 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Live CMUP Indicator Badge */}
                    {prod && (
                      <div className="flex flex-wrap items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-neutral-200/70 font-mono">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-emerald-600" />
                          Stock: {currentStock} → <span className="font-bold text-neutral-900">{newTotalQty} {prod.unit}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500">
                            Ancien coût : <span className="text-neutral-700">${oldCost.toFixed(2)}</span>
                          </span>
                          <ArrowRight className="w-3 h-3 text-neutral-400" />
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Nouveau CMUP : ${calculatedCMUP.toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode de règlement & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Mode de règlement fournisseur
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
              >
                <option value="CASH_USD">Espèces USD (Caisse)</option>
                <option value="CASH_CDF">Espèces CDF (Francs Congolais)</option>
                <option value="BANK_TRANSFER">Virement Bancaire (Compte Entreprise)</option>
                <option value="MPESA">Vodacom M-Pesa</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="CREDIT">Facture Fournisseur à crédit (En attente)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Notes ou observations
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : Colis vérifiés, fret payé séparément..."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Total Summary Banner */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between font-mono-nums">
            <div>
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">
                Total Arrivage Fournisseur :
              </span>
              <span className="text-[11px] text-emerald-700 font-sans">
                {lines.length} référence(s) · {lines.reduce((s, l) => s + l.quantity, 0)} pièces
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-black text-emerald-950 block">
                ${totalCostUSD.toFixed(2)} USD
              </span>
              <span className="text-xs font-semibold text-emerald-800 block">
                {totalCostCDF.toLocaleString('fr-FR')} CDF
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Valider la Réception & Mettre à Jour le Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
