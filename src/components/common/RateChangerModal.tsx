import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RefreshCw, X, Check } from 'lucide-react';

interface RateChangerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RateChangerModal: React.FC<RateChangerModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateExchangeRate } = useApp();
  const [rateInput, setRateInput] = useState<number>(settings.exchangeRateUSD_CDF || 2850);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rateInput > 0) {
      updateExchangeRate(rateInput);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 700);
    }
  };

  const presetRates = [2800, 2850, 2870, 2900, 2950];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base text-neutral-900">Ajuster le Taux du Jour (USD / CDF)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-sm text-neutral-600 mb-3">
              Modifiez le taux de conversion officiel ou du marché local. Toutes vos factures, devis et affichages en Francs Congolais (CDF) seront automatiquement actualisés.
            </p>
            
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Valeur pour 1 Dollar Américain ($1.00 USD)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1000"
                max="10000"
                step="10"
                value={rateInput}
                onChange={(e) => setRateInput(Number(e.target.value))}
                className="w-full text-2xl font-bold font-mono-nums text-neutral-900 bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">
                FC (CDF)
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-neutral-500 block mb-2 font-medium">Taux usuels du marché :</span>
            <div className="flex flex-wrap gap-2">
              {presetRates.map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setRateInput(rate)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    rateInput === rate
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  1$ = {rate.toLocaleString('fr-FR')} FC
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
            >
              {successMsg ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <span>Appliquer le Taux</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
