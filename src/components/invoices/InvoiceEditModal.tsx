import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, DocumentType, PaymentMethod, SaleItem, FiscalTaxGroup } from '../../types';
import { formatDualCurrency, getPaymentMethodLabel, getTaxGroupDetails } from '../../utils/formatters';
import { Plus, Trash2, X, Check, FileText, ShieldCheck, Edit3 } from 'lucide-react';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleToEdit: Sale | null;
}

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  isOpen,
  onClose,
  saleToEdit,
}) => {
  const { clients, products, updateSale, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [docType, setDocType] = useState<DocumentType>('INVOICE');
  const [clientId, setClientId] = useState<string>('');
  const [clientNif, setClientNif] = useState<string>('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discountUSD, setDiscountUSD] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(16);
  const [amountPaidUSD, setAmountPaidUSD] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isNormalizedDGI, setIsNormalizedDGI] = useState<boolean>(true);

  useEffect(() => {
    if (saleToEdit) {
      setDocType(saleToEdit.type);
      setClientId(saleToEdit.clientId || '');
      setClientNif(saleToEdit.clientNif || '');
      setItems(saleToEdit.items && saleToEdit.items.length > 0 ? [...saleToEdit.items] : []);
      setDiscountUSD(saleToEdit.discountUSD || 0);
      setTaxPercent(saleToEdit.taxPercent !== undefined ? saleToEdit.taxPercent : 16);
      setAmountPaidUSD(saleToEdit.amountPaidUSD || 0);
      setPaymentMethod(saleToEdit.paymentMethod || 'MPESA');
      setDueDate(saleToEdit.dueDate || '');
      setNotes(saleToEdit.notes || '');
      setIsNormalizedDGI(saleToEdit.isNormalizedDGI !== undefined ? saleToEdit.isNormalizedDGI : true);
    }
  }, [saleToEdit]);

  if (!isOpen || !saleToEdit) return null;

  // Client change handler
  const handleClientChange = (id: string) => {
    setClientId(id);
    if (id === 'comptoir') {
      setClientNif('NON-ASSUJETTI');
      return;
    }
    const cl = clients.find((c) => c.id === id);
    if (cl) {
      setClientNif(cl.nif || cl.rccmOrNif || '');
    }
  };

  // Recalculate totals
  const subtotalUSD = items.reduce((sum, it) => sum + (it.subtotalUSD || 0), 0);
  const taxable = Math.max(0, subtotalUSD - discountUSD);

  const groupABase = items
    .filter((i) => i.taxGroup === 'A')
    .reduce((sum, it) => {
      const ratio = subtotalUSD > 0 ? it.subtotalUSD / subtotalUSD : 0;
      return sum + (it.subtotalUSD - discountUSD * ratio);
    }, 0);

  const taxAmountUSD = taxPercent > 0 ? Math.max(0, groupABase) * (taxPercent / 100) : 0;
  const totalUSD = taxable + taxAmountUSD;
  const dualTotal = formatDualCurrency(totalUSD, rate);
  const dualSubtotal = formatDualCurrency(subtotalUSD, rate);

  // Item handlers
  const handleItemSelect = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    if (!selected) return;

    setItems((prev) => {
      const copy = [...prev];
      const qty = copy[index]?.quantity || 1;
      const tGroup = selected.taxGroup || 'A';
      const tRate = tGroup === 'A' ? 16 : 0;
      copy[index] = {
        itemId: selected.id,
        name: selected.name,
        code: selected.code,
        type: selected.type,
        unit: selected.unit,
        quantity: qty,
        unitPriceUSD: selected.priceUSD,
        unitCostPriceUSD: selected.costPriceUSD,
        subtotalUSD: qty * selected.priceUSD,
        taxGroup: tGroup,
        taxRate: tRate,
        taxAmountUSD: tGroup === 'A' ? qty * selected.priceUSD * 0.16 : 0,
      };
      return copy;
    });
  };

  const handleItemTaxGroupChange = (index: number, tGroup: FiscalTaxGroup) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const tRate = tGroup === 'A' ? 16 : 0;
      copy[index] = {
        ...it,
        taxGroup: tGroup,
        taxRate: tRate,
        taxAmountUSD: tGroup === 'A' ? it.subtotalUSD * (taxPercent / 100) : 0,
      };
      return copy;
    });
  };

  const handleQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(0, qty);
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const subtotal = validQty * it.unitPriceUSD;
      copy[index] = {
        ...it,
        quantity: validQty,
        subtotalUSD: subtotal,
        taxAmountUSD: it.taxGroup === 'A' ? subtotal * 0.16 : 0,
      };
      return copy;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    const validPrice = Math.max(0, price);
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const subtotal = it.quantity * validPrice;
      copy[index] = {
        ...it,
        unitPriceUSD: validPrice,
        subtotalUSD: subtotal,
        taxAmountUSD: it.taxGroup === 'A' ? subtotal * 0.16 : 0,
      };
      return copy;
    });
  };

  const handleAddItem = () => {
    const firstProduct = products[0];
    const tGroup = firstProduct?.taxGroup || 'A';
    setItems((prev) => [
      ...prev,
      {
        itemId: firstProduct?.id || `custom-${Date.now()}`,
        name: firstProduct?.name || 'Nouvel Article',
        code: firstProduct?.code || '',
        type: firstProduct?.type || 'PRODUCT',
        unit: firstProduct?.unit || 'Pièce',
        quantity: 1,
        unitPriceUSD: firstProduct?.priceUSD || 0,
        unitCostPriceUSD: firstProduct?.costPriceUSD || 0,
        subtotalUSD: firstProduct?.priceUSD || 0,
        taxGroup: tGroup,
        taxRate: tGroup === 'A' ? 16 : 0,
        taxAmountUSD: tGroup === 'A' ? (firstProduct?.priceUSD || 0) * 0.16 : 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Veuillez ajouter au moins une ligne d\'article ou prestation.');
      return;
    }

    const sanitizedItems = items.map((it) => {
      const q = it.quantity && it.quantity > 0 ? it.quantity : 1;
      const sub = q * it.unitPriceUSD;
      return {
        ...it,
        quantity: q,
        subtotalUSD: sub,
        taxAmountUSD: it.taxGroup === 'A' ? sub * 0.16 : 0,
      };
    });

    updateSale(saleToEdit.id, {
      type: docType,
      clientId,
      items: sanitizedItems,
      discountUSD,
      taxPercent,
      amountPaidUSD: docType === 'QUOTE_PROFORMA' ? 0 : amountPaidUSD,
      paymentMethod,
      dueDate,
      notes,
      clientNif,
      isNormalizedDGI,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-neutral-950 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                Modifier : {saleToEdit.saleNumber}
              </h3>
              <p className="text-xs text-neutral-400">
                {saleToEdit.type === 'QUOTE_PROFORMA' ? 'Devis Proforma' : 'Facture Commerciale / Reçu'} · {saleToEdit.clientName}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Document Type & Client selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            {/* Document Type */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Type de Document *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="INVOICE">Facture Commerciale Standard</option>
                <option value="QUOTE_PROFORMA">Devis Proforma (Offre)</option>
                <option value="RECEIPT">Reçu de Caisse / Paiement Direct</option>
              </select>
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Client Facturé *
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="comptoir">Client Comptoir (Consommateur Final)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.type === 'COMPANY' ? '(Entreprise)' : '(Particulier)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Client NIF */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                NIF Client (Fiscalité DGI)
              </label>
              <input
                type="text"
                value={clientNif}
                onChange={(e) => setClientNif(e.target.value)}
                placeholder="Ex: A2109845B"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono-nums text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Articles & Prestations Facturés ({items.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead className="bg-neutral-100 text-neutral-700 uppercase font-semibold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Article / Prestation</th>
                    <th className="py-2.5 px-3 w-24">Groupe TVA</th>
                    <th className="py-2.5 px-2 text-center w-32">Qté</th>
                    <th className="py-2.5 px-3 text-right w-28">Prix Unit. ($)</th>
                    <th className="py-2.5 px-3 text-right w-28">Total HT ($)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/60">
                      {/* Product Selector */}
                      <td className="py-2 px-3">
                        <select
                          value={it.itemId}
                          onChange={(e) => handleItemSelect(idx, e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded-md px-2 py-1.5 text-xs text-neutral-900 focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} [{p.type === 'SERVICE' ? 'Service' : `${p.stockQty} en stock`}] — ${p.priceUSD}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tax Group */}
                      <td className="py-2 px-3">
                        <select
                          value={it.taxGroup || 'A'}
                          onChange={(e) => handleItemTaxGroupChange(idx, e.target.value as FiscalTaxGroup)}
                          className="w-full bg-white border border-neutral-300 rounded-md px-1.5 py-1.5 text-[11px] font-bold text-neutral-900 focus:outline-none"
                        >
                          <option value="A">Gr. A (16% TVA)</option>
                          <option value="B">Gr. B (0% Export)</option>
                          <option value="C">Gr. C (Exonéré)</option>
                          <option value="D">Gr. D (Hors Champ)</option>
                        </select>
                      </td>

                      {/* Qty */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(idx, Math.max(1, (it.quantity || 1) - 1))}
                            className="w-6 h-6 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded text-xs transition-colors shrink-0"
                            title="Diminuer la quantité (-1)"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={it.quantity === 0 ? '' : it.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                handleQtyChange(idx, 0);
                              } else {
                                const num = parseFloat(val);
                                handleQtyChange(idx, isNaN(num) ? 0 : num);
                              }
                            }}
                            onBlur={() => {
                              if (!it.quantity || it.quantity <= 0) {
                                handleQtyChange(idx, 1);
                              }
                            }}
                            className="w-14 text-center font-mono-nums font-bold bg-white border border-neutral-300 rounded px-1 py-1 text-xs focus:outline-none focus:border-neutral-900 shadow-2xs"
                            placeholder="1"
                            title="Saisir directement la quantité"
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(idx, (it.quantity || 1) + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded text-xs transition-colors shrink-0"
                            title="Augmenter la quantité (+1)"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unitPriceUSD}
                          onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 text-right bg-white border border-neutral-300 rounded-md px-2 py-1.5 font-mono-nums font-bold text-neutral-900 focus:outline-none"
                        />
                      </td>

                      {/* Line Subtotal */}
                      <td className="py-2 px-3 text-right font-mono-nums font-bold text-neutral-900">
                        ${it.subtotalUSD.toFixed(2)}
                      </td>

                      {/* Delete item line */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-neutral-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations & Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Notes & Due Date */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Échéance de Règlement
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Notes & Conditions de Vente
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mentions particulières, coordonnées de virement bancaire..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-3 text-xs text-neutral-900 focus:outline-none focus:bg-white"
                />
              </div>

              {/* DGI Toggle */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-xs text-emerald-950 block">
                      Facturation Normalisée DGI RDC (DEF)
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      Génère le QR code fiscal et le sceau cryptographique SHA-256
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isNormalizedDGI}
                  onChange={(e) => setIsNormalizedDGI(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Totals summary card */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-600 pb-2 border-b border-neutral-200">
                <span>Total Brut HT :</span>
                <span className="font-mono-nums font-semibold">${subtotalUSD.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600">Remise Commerciale ($ USD) :</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountUSD}
                  onChange={(e) => setDiscountUSD(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right bg-white border border-neutral-300 rounded-md px-2 py-1 text-xs font-mono-nums font-semibold text-neutral-900 focus:outline-none"
                />
              </div>

              {/* Tax rate selector */}
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-100 border border-neutral-200">
                <span className="font-semibold text-neutral-700">TVA ({taxPercent}%) :</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTaxPercent(16)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      taxPercent > 0
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    16% Activé
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxPercent(0)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      taxPercent === 0
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    0% Désactivé
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Montant TVA Collectée ({taxPercent}%) :</span>
                <span className="font-mono-nums font-semibold text-emerald-800">${taxAmountUSD.toFixed(2)}</span>
              </div>

              {/* Grand Total */}
              <div className="p-3 bg-neutral-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-400 block uppercase font-bold">Total Net TTC</span>
                  <span className="text-lg font-bold font-mono-nums text-amber-400">
                    ${totalUSD.toFixed(2)} USD
                  </span>
                </div>
                <div className="text-right font-mono-nums text-xs text-neutral-300">
                  <span>≈ {dualTotal.cdf}</span>
                </div>
              </div>

              {/* Payment Advance if not quote */}
              {docType !== 'QUOTE_PROFORMA' && (
                <div className="pt-2 border-t border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 font-semibold">Acompte / Montant Réglé ($) :</span>
                    <input
                      type="number"
                      min="0"
                      max={totalUSD}
                      step="0.01"
                      value={amountPaidUSD}
                      onChange={(e) => setAmountPaidUSD(parseFloat(e.target.value) || 0)}
                      className="w-28 text-right bg-white border border-neutral-300 rounded-md px-2 py-1 text-xs font-mono-nums font-bold text-emerald-700 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700">Mode de Paiement :</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="bg-white border border-neutral-300 rounded-md px-2 py-1 text-xs font-semibold text-neutral-900 focus:outline-none"
                    >
                      <option value="MPESA">M-Pesa (Vodacom)</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="AIRTEL_MONEY">Airtel Money</option>
                      <option value="CASH_USD">Espèces (USD $)</option>
                      <option value="CASH_CDF">Espèces (Francs CDF)</option>
                      <option value="BANK_TRANSFER">Virement Bancaire (Rawbank/Equity)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>Enregistrer les Modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
