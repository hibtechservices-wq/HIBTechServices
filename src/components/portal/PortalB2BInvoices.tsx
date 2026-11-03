import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatters';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Receipt
} from 'lucide-react';

export const PortalB2BInvoices: React.FC = () => {
  const { sales, portalClient, settings, setActivePrintSale } = useApp();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [search, setSearch] = useState('');

  if (!portalClient) return null;

  // Filter client's invoices
  const clientInvoices = sales.filter((s) => {
    if (s.type !== 'INVOICE') return false;
    return (
      s.clientId === portalClient.id ||
      s.clientName.toLowerCase().includes(portalClient.name.toLowerCase()) ||
      (portalClient.companyName && s.clientName.toLowerCase().includes(portalClient.companyName.toLowerCase()))
    );
  });

  const filtered = clientInvoices.filter((inv) => {
    if (filterStatus === 'PAID' && inv.paymentStatus !== 'PAID') return false;
    if (filterStatus === 'UNPAID' && inv.paymentStatus === 'PAID') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        inv.saleNumber.toLowerCase().includes(q) ||
        (inv.dgiNfu && inv.dgiNfu.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const paidCount = clientInvoices.filter((i) => i.paymentStatus === 'PAID').length;
  const unpaidCount = clientInvoices.filter((i) => i.paymentStatus !== 'PAID').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-emerald-950 p-6 rounded-2xl text-white border border-emerald-900/40 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Espace Comptabilité & Fiscalité B2B
            </span>
            <h2 className="text-xl font-bold tracking-tight mt-1">
              Vos Factures Soldées avec Cachet Officiel & Certification DGI
            </h2>
            <p className="text-xs text-neutral-300 mt-0.5">
              Téléchargez vos factures acquittées, décharges de paiement et bordereaux normalisés prêts pour votre comptabilité.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-mono font-bold">
              {clientInvoices.length} facture(s) émise(s)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-neutral-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par N° facture ou NFU..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Toutes ({clientInvoices.length})
          </button>
          <button
            onClick={() => setFilterStatus('PAID')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'PAID'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Soldées ({paidCount})
          </button>
          <button
            onClick={() => setFilterStatus('UNPAID')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterStatus === 'UNPAID'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            En attente ({unpaidCount})
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
          <Receipt className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">Aucune facture trouvée</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Aucun document ne correspond à vos filtres actuels.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50 text-neutral-700 uppercase font-semibold text-[10px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">N° Facture</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">NFU Normalisé DGI</th>
                  <th className="py-3 px-4 text-right">Montant Total</th>
                  <th className="py-3 px-4 text-center">État & Cachet</th>
                  <th className="py-3 px-4 text-right">Document Officiel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono-nums">
                {filtered.map((inv) => {
                  const isPaid = inv.paymentStatus === 'PAID';
                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50/70">
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        {inv.saleNumber}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-neutral-600">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px]">
                          {inv.dgiNfu || 'SFN-NORMALISÉ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-neutral-900">
                        ${inv.totalUSD.toFixed(2)}
                        <span className="block text-[10px] text-neutral-400 font-normal">
                          {inv.totalCDF.toLocaleString('fr-FR')} FC
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            PAYÉE & ACQUITTÉE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            EN ATTENTE ({inv.remainingDebtUSD.toFixed(2)}$)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActivePrintSale(inv)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-sans font-bold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer / PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
