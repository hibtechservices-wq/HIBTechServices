import React, { useState } from 'react';
import { formatDualCurrency } from '../../utils/formatters';
import { PaymentMethod } from '../../types';
import {
  DollarSign,
  Coins,
  ArrowRight,
  Check,
  X,
  Calculator,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PosDualCurrencyChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUSD: number;
  exchangeRate: number;
  onConfirmPayment: (paidUSD: number, method: PaymentMethod, notes?: string) => void;
}

export const PosDualCurrencyChangeModal: React.FC<PosDualCurrencyChangeModalProps> = ({
  isOpen,
  onClose,
  totalUSD,
  exchangeRate,
  onConfirmPayment,
}) => {
  const [receivedUSD, setReceivedUSD] = useState<number>(0);
  const [receivedCDF, setReceivedCDF] = useState<number>(0);
  const [returnCurrency, setReturnCurrency] = useState<'USD' | 'CDF'>('CDF');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_USD');

  if (!isOpen) return null;

  const totalCDF = Math.round(totalUSD * exchangeRate);

  // Conversion of CDF received into USD equivalent
  const cdfInUSD = exchangeRate > 0 ? receivedCDF / exchangeRate : 0;
  const totalReceivedUSD = receivedUSD + cdfInUSD;
  const totalReceivedCDF = Math.round(totalReceivedUSD * exchangeRate);

  // Difference / Change
  const changeUSD = Math.max(0, totalReceivedUSD - totalUSD);
  const changeCDF = Math.round(changeUSD * exchangeRate);
  const isSufficient = totalReceivedUSD >= totalUSD - 0.005;
  const remainingDueUSD = Math.max(0, totalUSD - totalReceivedUSD);
  const remainingDueCDF = Math.round(remainingDueUSD * exchangeRate);

  // Suggested bank notes for Congolese Market
  const getDenominationBreakdown = (amount: number, currency: 'USD' | 'CDF') => {
    if (amount <= 0) return [];
    if (currency === 'CDF') {
      const notes = [20000, 10000, 5000, 1000, 500];
      const result: { note: number; count: number }[] = [];
      let rem = Math.floor(amount / 500) * 500; // round to nearest 500 FC
      for (const n of notes) {
        if (rem >= n) {
          const count = Math.floor(rem / n);
          result.push({ note: n, count });
          rem %= n;
        }
      }
      return result;
    } else {
      const notes = [50, 20, 10, 5, 1];
      const result: { note: number; count: number }[] = [];
      let rem = Math.floor(amount);
      for (const n of notes) {
        if (rem >= n) {
          const count = Math.floor(rem / n);
          result.push({ note: n, count });
          rem %= n;
        }
      }
      return result;
    }
  };

  const cdfNotes = getDenominationBreakdown(changeCDF, 'CDF');
  const usdNotes = getDenominationBreakdown(changeUSD, 'USD');

  const handleApplyExactUSD = () => {
    setReceivedUSD(totalUSD);
    setReceivedCDF(0);
  };

  const handleApplyExactCDF = () => {
    setReceivedUSD(0);
    setReceivedCDF(totalCDF);
  };

  const handleQuickAddUSD = (amount: number) => {
    setReceivedUSD(prev => prev + amount);
  };

  const handleQuickAddCDF = (amount: number) => {
    setReceivedCDF(prev => prev + amount);
  };

  const handleReset = () => {
    setReceivedUSD(0);
    setReceivedCDF(0);
  };

  const handleValidate = () => {
    if (!isSufficient) return;
    const notes = `Paiement mixte reçu : ${receivedUSD > 0 ? `$${receivedUSD.toFixed(2)} USD ` : ''}${receivedCDF > 0 ? `${receivedCDF.toLocaleString()} CDF ` : ''}| Rendu : ${returnCurrency === 'CDF' ? `${changeCDF.toLocaleString()} CDF` : `$${changeUSD.toFixed(2)} USD`}`;
    onConfirmPayment(totalUSD, paymentMethod, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Calculateur de Rendu de Monnaie Bidevise</h3>
              <p className="text-[11px] text-neutral-400">
                Paiement mixte Dollars ($ USD) et Francs Congolais (CDF) · Taux 1$ = {exchangeRate.toLocaleString()} FC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total to pay banner */}
        <div className="bg-amber-500/10 p-4 border-b border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Montant Total Dû
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono-nums text-neutral-950">
                ${totalUSD.toFixed(2)}
              </span>
              <span className="text-sm font-bold font-mono-nums text-amber-800">
                ({totalCDF.toLocaleString()} FC)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleApplyExactUSD}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-neutral-300 text-[11px] font-bold text-neutral-800 hover:bg-neutral-100 shadow-2xs"
            >
              Exact en USD
            </button>
            <button
              type="button"
              onClick={handleApplyExactCDF}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-neutral-300 text-[11px] font-bold text-neutral-800 hover:bg-neutral-100 shadow-2xs"
            >
              Exact en CDF
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Dual Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Dollars Reçus */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Espèces en Dollars ($ USD)</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={receivedUSD || ''}
                  onChange={(e) => setReceivedUSD(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-base font-bold font-mono-nums text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
              </div>
              {/* Quick buttons */}
              <div className="flex items-center gap-1 pt-1 flex-wrap">
                {[5, 10, 20, 50, 100].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleQuickAddUSD(b)}
                    className="px-2 py-0.5 bg-white border border-neutral-200 text-neutral-700 rounded text-[10px] font-bold hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    +${b}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Francs Congolais Reçus */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>Espèces en Francs (CDF)</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={receivedCDF || ''}
                  onChange={(e) => setReceivedCDF(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-base font-bold font-mono-nums text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-[10px]">FC</span>
              </div>
              {/* Quick buttons */}
              <div className="flex items-center gap-1 pt-1 flex-wrap">
                {[5000, 10000, 20000, 50000].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleQuickAddCDF(b)}
                    className="px-2 py-0.5 bg-white border border-neutral-200 text-neutral-700 rounded text-[10px] font-bold hover:bg-amber-50 hover:border-amber-300"
                  >
                    +{(b / 1000)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cumulative Total Received Box */}
          <div className="p-3 bg-neutral-100 rounded-xl flex items-center justify-between font-mono-nums">
            <div className="flex items-center gap-2">
              <span className="text-neutral-600 text-xs">Total Reçu Cumulé :</span>
              <span className="font-bold text-neutral-900 text-sm">
                ${totalReceivedUSD.toFixed(2)} USD
              </span>
              <span className="text-neutral-500 text-xs">
                ({totalReceivedCDF.toLocaleString()} FC)
              </span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-neutral-500 hover:text-neutral-800 text-[11px] font-medium flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          </div>

          {/* Change or Due Result Box */}
          {isSufficient ? (
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Monnaie à Rendre (Reliquat)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black font-mono-nums text-emerald-950">
                      {returnCurrency === 'CDF' ? `${changeCDF.toLocaleString()} FC` : `$${changeUSD.toFixed(2)} USD`}
                    </span>
                    <span className="text-xs text-emerald-800 font-mono-nums">
                      (Équivaut à {returnCurrency === 'CDF' ? `$${changeUSD.toFixed(2)} USD` : `${changeCDF.toLocaleString()} FC`})
                    </span>
                  </div>
                </div>

                {/* Return currency toggle */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-emerald-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setReturnCurrency('CDF')}
                    className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                      returnCurrency === 'CDF'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    Rendre en CDF (FC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnCurrency('USD')}
                    className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                      returnCurrency === 'USD'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    Rendre en USD ($)
                  </button>
                </div>
              </div>

              {/* Recommended bills breakdown */}
              {changeUSD > 0 && (
                <div className="pt-2 border-t border-emerald-200/80">
                  <span className="text-[10px] uppercase font-bold text-emerald-900 block mb-1">
                    Décomposition recommandée des coupures à sortir du tiroir :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {returnCurrency === 'CDF' ? (
                      cdfNotes.length > 0 ? (
                        cdfNotes.map((n, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-900 font-mono-nums font-bold rounded text-[11px]"
                          >
                            {n.count}x billet(s) de {n.note.toLocaleString()} FC
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-800">Aucun reliquat à rendre.</span>
                      )
                    ) : (
                      usdNotes.length > 0 ? (
                        usdNotes.map((n, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-900 font-mono-nums font-bold rounded text-[11px]"
                          >
                            {n.count}x coupure(s) de ${n.note}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-800">Aucun reliquat à rendre.</span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Montant insuffisant</span>
                <span className="text-[11px] text-rose-700">
                  Il manque encore ${remainingDueUSD.toFixed(2)} USD ({remainingDueCDF.toLocaleString()} FC).
                </span>
              </div>
              <span className="text-base font-black font-mono-nums text-rose-950">
                -${remainingDueUSD.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Fermer
          </button>

          <button
            type="button"
            disabled={!isSufficient}
            onClick={handleValidate}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isSufficient
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Valider l'Encaissement & Imprimer Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
