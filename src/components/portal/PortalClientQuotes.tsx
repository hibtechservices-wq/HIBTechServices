import React from 'react';
import { Sale, Client, ProductOrService } from '../../types';
import { formatDate, formatDualCurrency } from '../../utils/formatters';
import {
  FileText,
  Printer,
  Calendar,
  Clock,
  ArrowRight,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ShoppingBag,
} from 'lucide-react';

interface PortalClientQuotesProps {
  sales: Sale[];
  portalClient: Client | null;
  exchangeRate: number;
  onViewPrintSale: (sale: Sale) => void;
  onOpenCatalog: () => void;
  onOpenAuthModal: () => void;
}

export const PortalClientQuotes: React.FC<PortalClientQuotesProps> = ({
  sales,
  portalClient,
  exchangeRate,
  onViewPrintSale,
  onOpenCatalog,
  onOpenAuthModal,
}) => {
  // Filter proformas/quotes belonging to this client or all proformas if demo
  const clientQuotes = sales.filter((s) => {
    if (s.type !== 'QUOTE_PROFORMA') return false;
    if (!portalClient) return true; // Show proformas generated in this browser/session
    return (
      s.clientId === portalClient.id ||
      s.clientName.toLowerCase().includes(portalClient.name.toLowerCase()) ||
      (portalClient.companyName && s.clientName.toLowerCase().includes(portalClient.companyName.toLowerCase()))
    );
  });

  if (!portalClient && clientQuotes.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-dashed border-neutral-300 max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <FileText className="w-7 h-7 text-neutral-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-neutral-900">
            Aucun devis proforma enregistré
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Connectez-vous à votre compte client ou générez votre premier devis depuis le catalogue en image.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenCatalog}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Consulter le Catalogue
          </button>
          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Se Connecter / Créer un Compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Mes Devis & Factures Proformas Enregistrés ({clientQuotes.length})</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Historique de tous les devis proformas générés en ligne. Téléchargez le PDF officiel ou imprimez à tout moment.
          </p>
        </div>

        <button
          onClick={onOpenCatalog}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Nouveau Devis Proforma</span>
        </button>
      </div>

      {/* Quotes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientQuotes.map((quote) => {
          const rate = quote.exchangeRate || exchangeRate;
          const dualTotal = formatDualCurrency(quote.totalUSD, rate);
          const totalItems = quote.items.reduce((s, it) => s + it.quantity, 0);

          return (
            <div
              key={quote.id}
              className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 block mb-0.5">
                      N° DEVIS PROFORMA
                    </span>
                    <span className="text-sm font-bold text-neutral-900 font-mono">
                      {quote.saleNumber}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Offre Proforma
                  </span>
                </div>

                {/* Client and Date info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 block">Établi le</span>
                    <span className="font-semibold text-neutral-800">
                      {formatDate(quote.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block">Validité de l'offre</span>
                    <span className="font-semibold text-emerald-700">
                      {quote.dueDate ? formatDate(quote.dueDate) : '30 jours'}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Articles inclus ({totalItems} au total) :
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                    {quote.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-neutral-700 text-[11px]">
                        <span className="truncate max-w-[200px]">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono-nums font-semibold shrink-0">
                          ${item.subtotalUSD.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom: Total & Actions */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-neutral-500 block">Montant Total TTC</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-emerald-700 font-mono-nums">
                      ${quote.totalUSD.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      ({dualTotal.cdf} FC)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewPrintSale(quote)}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 group"
                >
                  <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Imprimer / PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
