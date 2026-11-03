import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentType, PaymentMethod, SaleItem, FiscalTaxGroup } from '../../types';
import { formatDualCurrency, getPaymentMethodLabel, getTaxGroupDetails } from '../../utils/formatters';
import { Plus, Trash2, X, Check, FileText, ShieldCheck, HelpCircle, Ban, Percent } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: DocumentType;
  defaultClientId?: string;
}

export const InvoiceCreateModal: React.FC<InvoiceCreateModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'INVOICE',
  defaultClientId,
}) => {
  const { clients, products, createSale, settings, setActivePrintSale } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [docType, setDocType] = useState<DocumentType>(defaultType);
  const [clientId, setClientId] = useState<string>(defaultClientId || (clients[0]?.id || ''));
  const [clientNif, setClientNif] = useState<string>(clients[0]?.nif || '');
  
  const [items, setItems] = useState<SaleItem[]>([
    {
      itemId: products[0]?.id || 'item-1',
      name: products[0]?.name || 'Article / Service',
      code: products[0]?.code || '',
      type: products[0]?.type || 'PRODUCT',
      unit: products[0]?.unit || 'Pièce',
      quantity: 1,
      unitPriceUSD: products[0]?.priceUSD || 0,
      unitCostPriceUSD: products[0]?.costPriceUSD || 0,
      subtotalUSD: products[0]?.priceUSD || 0,
      taxGroup: products[0]?.taxGroup || 'A',
      taxRate: products[0]?.taxGroup === 'A' ? 16 : 0,
      taxAmountUSD: products[0]?.taxGroup === 'A' ? (products[0]?.priceUSD * 0.16) : 0,
    },
  ]);

  const [discountUSD, setDiscountUSD] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(
    settings.enableTaxByDefault && settings.dgiIsVatSubject ? (settings.taxPercent || 16) : 0
  );
  const [amountPaidUSD, setAmountPaidUSD] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isNormalizedDGI, setIsNormalizedDGI] = useState<boolean>(true);

  if (!isOpen) return null;

  // Selected client update handler
  const handleClientChange = (id: string) => {
    setClientId(id);
    if (id === 'comptoir') {
      setClientNif('NON-ASSUJETTI');
      return;
    }
    const cl = clients.find(c => c.id === id);
    if (cl) {
      setClientNif(cl.nif || cl.rccmOrNif || '');
    }
  };

  // Recalculate totals
  const subtotalUSD = items.reduce((sum, it) => sum + it.subtotalUSD, 0);
  const taxable = Math.max(0, subtotalUSD - discountUSD);
  
  // Calculate VAT based on items with taxGroup 'A'
  const groupABase = items.filter(i => i.taxGroup === 'A').reduce((sum, it) => {
    const ratio = subtotalUSD > 0 ? it.subtotalUSD / subtotalUSD : 0;
    return sum + (it.subtotalUSD - (discountUSD * ratio));
  }, 0);

  const taxAmountUSD = taxPercent > 0 ? (Math.max(0, groupABase) * (taxPercent / 100)) : 0;
  const totalUSD = taxable + taxAmountUSD;
  const dualTotal = formatDualCurrency(totalUSD, rate);
  const dualSubtotal = formatDualCurrency(subtotalUSD, rate);

  // Line item handlers
  const handleItemSelect = (index: number, productId: string) => {
    const selected = products.find(p => p.id === productId);
    if (!selected) return;

    setItems(prev => {
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
        taxAmountUSD: (qty * selected.priceUSD * tRate) / 100,
      };
      return copy;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = Math.max(0, qty);
    setItems(prev => {
      const copy = [...prev];
      const item = copy[index];
      const sub = validQty * item.unitPriceUSD;
      copy[index] = {
        ...item,
        quantity: validQty,
        subtotalUSD: sub,
        taxAmountUSD: (sub * item.taxRate) / 100,
      };
      return copy;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    if (price < 0) price = 0;
    setItems(prev => {
      const copy = [...prev];
      const item = copy[index];
      const sub = item.quantity * price;
      copy[index] = {
        ...item,
        unitPriceUSD: price,
        subtotalUSD: sub,
        taxAmountUSD: (sub * item.taxRate) / 100,
      };
      return copy;
    });
  };

  const handleTaxGroupChange = (index: number, group: FiscalTaxGroup) => {
    setItems(prev => {
      const copy = [...prev];
      const item = copy[index];
      const rateVal = group === 'A' ? 16 : 0;
      copy[index] = {
        ...item,
        taxGroup: group,
        taxRate: rateVal,
        taxAmountUSD: (item.subtotalUSD * rateVal) / 100,
      };
      return copy;
    });
  };

  const handleAddItemRow = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    const tGroup = firstProd.taxGroup || 'A';
    const tRate = tGroup === 'A' ? 16 : 0;
    setItems(prev => [
      ...prev,
      {
        itemId: firstProd.id,
        name: firstProd.name,
        code: firstProd.code,
        type: firstProd.type,
        unit: firstProd.unit,
        quantity: 1,
        unitPriceUSD: firstProd.priceUSD,
        unitCostPriceUSD: firstProd.costPriceUSD,
        subtotalUSD: firstProd.priceUSD,
        taxGroup: tGroup,
        taxRate: tRate,
        taxAmountUSD: (firstProd.priceUSD * tRate) / 100,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;

    // Sanitize any empty or zero quantity to 1
    const finalItems = items.map(it => {
      const q = it.quantity && it.quantity > 0 ? it.quantity : 1;
      const sub = q * it.unitPriceUSD;
      return {
        ...it,
        quantity: q,
        subtotalUSD: sub,
        taxAmountUSD: (sub * it.taxRate) / 100,
      };
    });

    const newSale = createSale({
      type: docType,
      clientId,
      clientNif: clientNif.trim() || undefined,
      items: finalItems,
      discountUSD,
      taxPercent,
      amountPaidUSD: docType === 'QUOTE_PROFORMA' ? 0 : amountPaidUSD,
      paymentMethod,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      isNormalizedDGI,
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err) {}

    onClose();
    setActivePrintSale(newSale);
  };

  const paymentMethods: PaymentMethod[] = [
    'MPESA',
    'ORANGE_MONEY',
    'AIRTEL_MONEY',
    'AFRIMONEY',
    'CASH_USD',
    'CASH_CDF',
    'BANK_TRANSFER',
    'CREDIT',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <span>{docType === 'INVOICE' ? 'Émettre une Facture Normalisée DGI' : 'Établir un Devis Proforma'}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded font-mono">
                  DEF RDC Conforme
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                NIF Émetteur : <span className="font-mono-nums text-amber-400 font-semibold">{settings.nif}</span> · Taux BCC : <span className="font-mono-nums text-neutral-200 font-semibold">1$ = {rate} FC</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Top Options Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            {/* Type Document */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Type de Document Fiscal
              </label>
              <div className="flex bg-neutral-200 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setDocType('INVOICE');
                    setAmountPaidUSD(totalUSD);
                  }}
                  className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
                    docType === 'INVOICE' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600'
                  }`}
                >
                  Facture Normalisée
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocType('QUOTE_PROFORMA');
                    setAmountPaidUSD(0);
                  }}
                  className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
                    docType === 'QUOTE_PROFORMA' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600'
                  }`}
                >
                  Devis Proforma
                </button>
              </div>
            </div>

            {/* Client Picker */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Client (Acheteur)
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium"
              >
                <option value="comptoir">Client Comptoir (Consommateur Final)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''} — [{c.city}]
                  </option>
                ))}
              </select>
            </div>

            {/* Client NIF for DGI compliance */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                NIF Client (Obligatoire B2B DGI)
              </label>
              <input
                type="text"
                value={clientNif}
                onChange={(e) => setClientNif(e.target.value)}
                placeholder="Ex: A1928374P ou NON-ASSUJETTI"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono-nums"
              />
            </div>
          </div>

          {/* Line Items Table with DGI Fiscal Groups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Lignes d'Articles & Prestations avec Groupe TVA DGI ({items.length})</span>
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-3 py-1 text-xs font-medium text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1 shadow-2xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                <thead className="bg-neutral-100 text-neutral-700 uppercase font-semibold text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Article / Prestation</th>
                    <th className="py-2.5 px-2 text-center w-28">Gr. TVA DGI</th>
                    <th className="py-2.5 px-2 text-center w-32">Qté</th>
                    <th className="py-2.5 px-3 text-right w-24">Prix HT ($)</th>
                    <th className="py-2.5 px-3 text-right w-24">Total HT ($)</th>
                    <th className="py-2.5 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {items.map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-neutral-50/50">
                      {/* Select product */}
                      <td className="p-2">
                        <select
                          value={row.itemId}
                          onChange={(e) => handleItemSelect(idx, e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1.5 text-xs text-neutral-900 focus:outline-none focus:bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.type === 'PRODUCT' ? 'PROD' : 'SERV'}] {p.name} (${p.priceUSD})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tax Group Selector */}
                      <td className="p-2 text-center">
                        <select
                          value={row.taxGroup}
                          onChange={(e) => handleTaxGroupChange(idx, e.target.value as FiscalTaxGroup)}
                          className="w-full bg-neutral-50 border border-neutral-300 rounded px-1.5 py-1.5 text-[11px] font-semibold text-neutral-900 focus:outline-none"
                        >
                          <option value="A">Gr. A (16% TVA)</option>
                          <option value="B">Gr. B (0%)</option>
                          <option value="C">Gr. C (Exonéré)</option>
                          <option value="D">Gr. D (Hors champ)</option>
                        </select>
                      </td>

                      {/* Quantity */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, Math.max(1, (row.quantity || 1) - 1))}
                            className="w-6 h-6 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded text-xs transition-colors shrink-0"
                            title="Diminuer la quantité (-1)"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={row.quantity === 0 ? '' : row.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                handleQuantityChange(idx, 0);
                              } else {
                                const num = parseFloat(val);
                                handleQuantityChange(idx, isNaN(num) ? 0 : num);
                              }
                            }}
                            onBlur={() => {
                              if (!row.quantity || row.quantity <= 0) {
                                handleQuantityChange(idx, 1);
                              }
                            }}
                            className="w-14 text-center font-mono-nums font-bold bg-white border border-neutral-300 rounded px-1 py-1 text-xs focus:outline-none focus:border-neutral-900 shadow-2xs"
                            placeholder="1"
                            title="Saisir directement la quantité"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(idx, (row.quantity || 1) + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded text-xs transition-colors shrink-0"
                            title="Augmenter la quantité (+1)"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={row.unitPriceUSD}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          className="w-20 text-right font-mono-nums bg-neutral-50 border border-neutral-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:bg-white"
                        />
                      </td>

                      {/* Row Subtotal */}
                      <td className="p-2 text-right font-mono-nums font-semibold text-neutral-900">
                        ${row.subtotalUSD.toFixed(2)}
                      </td>

                      {/* Delete Row */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={items.length <= 1}
                          className="text-neutral-400 hover:text-rose-600 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals, Taxes & Payment section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Payment terms & notes */}
            <div className="space-y-4">
              {docType === 'INVOICE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                      Mode de Règlement RDC
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
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
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Montant Encaissé Immédiatement ($ USD)
                      </label>
                      <button
                        type="button"
                        onClick={() => setAmountPaidUSD(totalUSD)}
                        className="text-[11px] text-emerald-700 hover:underline font-medium"
                      >
                        Paiement 100% (${totalUSD.toFixed(2)})
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={totalUSD}
                      step="0.5"
                      value={amountPaidUSD}
                      onChange={(e) => setAmountPaidUSD(Number(e.target.value))}
                      className="w-full font-mono-nums font-bold text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
                    />
                  </div>

                  {amountPaidUSD < totalUSD && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                        Date d'échéance de la créance
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Conditions / Notes particulières
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Garantie 12 mois, livraison sur site..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Calculations Box with DGI Table */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2.5 font-mono-nums text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Total Base HT :</span>
                <span>${subtotalUSD.toFixed(2)}</span>
              </div>

              {discountUSD > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Remise accordée :</span>
                  <span>-${discountUSD.toFixed(2)}</span>
                </div>
              )}

              {/* TVA Toggle Switch */}
              <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200">
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 rounded ${taxPercent > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-sans font-bold text-neutral-800 text-xs block">TVA ({taxPercent > 0 ? taxPercent : 0}%)</span>
                    <span className="text-[10px] text-neutral-500 font-sans block">
                      {taxPercent > 0 ? 'Application de la TVA 16%' : 'TVA désactivée (0% Exonéré / Hors Taxe)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTaxPercent(taxPercent > 0 ? 0 : (settings.taxPercent || 16))}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                    taxPercent > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                  }`}
                >
                  {taxPercent > 0 ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Active ({taxPercent}%)</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3 h-3" />
                      <span>Désactivée (0%)</span>
                    </>
                  )}
                </button>
              </div>

              {/* DRC VAT Row */}
              {taxPercent > 0 ? (
                <div className="flex justify-between items-center py-1 border-y border-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-semibold text-neutral-800">TVA RDC ({taxPercent}%)</span>
                    <span className="text-[10px] text-neutral-500 font-sans">(Sur base Gr. A)</span>
                  </div>
                  <span className="font-bold text-neutral-900">+${taxAmountUSD.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center py-1 border-y border-neutral-200 text-neutral-500 italic text-[11px]">
                  <span className="font-sans not-italic font-medium">TVA (0%) :</span>
                  <span className="font-sans not-italic font-semibold text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">
                    Désactivée (0% Hors Taxe)
                  </span>
                </div>
              )}

              {/* Net Payable */}
              <div className="pt-1 flex justify-between font-bold text-base text-neutral-900">
                <span>TOTAL TTC ($) :</span>
                <span>{dualTotal.usd}</span>
              </div>

              <div className="flex justify-between font-bold text-neutral-800 bg-amber-100 p-2 rounded">
                <span>ÉQUIVALENT CDF :</span>
                <span>{dualTotal.cdf}</span>
              </div>

              {docType === 'INVOICE' && (
                <div className="pt-2 border-t border-neutral-200 text-xs space-y-1">
                  <div className="flex justify-between text-emerald-700">
                    <span>Acompte Encaissé :</span>
                    <span>${amountPaidUSD.toFixed(2)}</span>
                  </div>
                  {totalUSD - amountPaidUSD > 0 && (
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>Créance restante :</span>
                      <span>${(totalUSD - amountPaidUSD).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Génération automatique du NFU et QR Code fiscal DGI</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-medium text-neutral-900 bg-amber-400 hover:bg-amber-300 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Valider Facture Normalisée DEF & Imprimer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
