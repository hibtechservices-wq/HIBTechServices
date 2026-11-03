import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, DocumentType, SaleStatus } from '../../types';
import { formatDate, formatDateTime, formatDualCurrency, getDocumentTypeLabel } from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { Printer, Download, Filter, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesReportModal: React.FC<SalesReportModalProps> = ({ isOpen, onClose }) => {
  const { sales, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (selectedType !== 'ALL' && s.type !== selectedType) return false;
      if (selectedStatus !== 'ALL' && s.paymentStatus !== selectedStatus) return false;
      if (startDate && new Date(s.createdAt) < new Date(startDate)) return false;
      if (endDate && new Date(s.createdAt) > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [sales, selectedType, selectedStatus, startDate, endDate]);

  const summary = useMemo(() => {
    let totalInvoicedUSD = 0;
    let totalPaidUSD = 0;
    let totalDebtUSD = 0;
    let totalTaxUSD = 0;

    filteredSales.forEach((s) => {
      totalInvoicedUSD += s.totalUSD;
      totalPaidUSD += s.amountPaidUSD;
      totalDebtUSD += s.remainingDebtUSD;
      totalTaxUSD += s.taxAmountUSD;
    });

    return {
      totalCount: filteredSales.length,
      totalInvoicedUSD,
      totalPaidUSD,
      totalDebtUSD,
      totalTaxUSD,
    };
  }, [filteredSales]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const filename = `Rapport_Ventes_${new Date().toISOString().slice(0, 10)}.pdf`;
      await downloadElementAsPDF(printAreaRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 8,
        scale: 2.0,
        maxSizeBytes: 3 * 1024 * 1024,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="print:hidden p-4 border-b border-neutral-200 bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 text-amber-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Rapport Général des Ventes & Factures (PDF)</h2>
              <p className="text-xs text-neutral-400">Édition conforme A4 avec totaux et créances en USD / CDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct PDF Download */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPDF ? 'Création PDF...' : 'Télécharger PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs border border-neutral-700"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Bar (Hidden in Print) */}
        <div className="print:hidden p-4 bg-neutral-50 border-b border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Type de Document</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800"
            >
              <option value="ALL">Tous les types</option>
              <option value="INVOICE">Factures</option>
              <option value="QUOTE_PROFORMA">Devis / Proformas</option>
              <option value="RECEIPT">Reçus / Tickets</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Statut Paiement</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PAID">Payées</option>
              <option value="PARTIAL">Acomptes (Partiel)</option>
              <option value="UNPAID">Non Payées (Créances)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Date Début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Date Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800"
            />
          </div>
        </div>

        {/* Document Print Area (Bleu & Blanc) */}
        <div ref={printAreaRef} className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          {/* Header Bleu & Blanc */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-5 rounded-xl border-b-4 border-blue-500 shadow-xs mb-5 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">{settings.name}</h1>
              <p className="text-xs text-blue-100 font-medium">{settings.slogan}</p>
              <p className="text-xs text-blue-200 mt-1">{settings.address}, {settings.city} - RDC</p>
              <p className="text-xs text-blue-200">Tél: {settings.phone1} | Email: {settings.email}</p>
              <div className="text-[11px] text-blue-300 font-mono mt-1">
                NIF: {settings.nif} | RCCM: {settings.rccm} | ID.NAT: {settings.idNat}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-white text-blue-950 px-3 py-1 rounded text-xs font-black uppercase tracking-wider mb-2 shadow-xs">
                RAPPORT DES VENTES
              </div>
              <p className="text-xs text-blue-200">Édité le : <strong className="text-white">{formatDateTime(new Date().toISOString())}</strong></p>
              <p className="text-xs font-bold text-white mt-1">Taux : 1 USD = {rate.toLocaleString('fr-FR')} CDF</p>
            </div>
          </div>

          {/* KPI Summary Banner with Settlement Gauge */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-blue-50/70 border-2 border-blue-200 rounded-xl mb-5 text-center text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-2xs">
              <p className="text-blue-900 font-bold uppercase text-[10px]">Documents</p>
              <p className="text-base font-black text-slate-950">{summary.totalCount}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-2xs">
              <p className="text-blue-900 font-bold uppercase text-[10px]">Total Facturé</p>
              <p className="text-base font-black text-blue-950">${summary.totalInvoicedUSD.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500 font-mono">({(summary.totalInvoicedUSD * rate).toLocaleString('fr-FR')} FC)</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-2xs">
              <p className="text-emerald-700 font-bold uppercase text-[10px]">Total Encaissé</p>
              <p className="text-base font-black text-emerald-700">${summary.totalPaidUSD.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-600 font-bold">
                Jauge : {summary.totalInvoicedUSD > 0 ? Math.round((summary.totalPaidUSD / summary.totalInvoicedUSD) * 100) : 100}%
              </p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-2xs">
              <p className="text-rose-700 font-bold uppercase text-[10px]">Créances Restantes</p>
              <p className="text-base font-black text-rose-700">${summary.totalDebtUSD.toFixed(2)}</p>
              <p className="text-[10px] text-rose-600 font-bold">
                {summary.totalInvoicedUSD > 0 ? Math.round((summary.totalDebtUSD / summary.totalInvoicedUSD) * 100) : 0}% Dû
              </p>
            </div>
          </div>

          {/* Sales Table (Haute Lisibilité) */}
          <div className="rounded-xl border-2 border-blue-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Réf / NFU</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3 text-right">Total USD</th>
                  <th className="py-2.5 px-3 text-right">Encaissé</th>
                  <th className="py-2.5 px-3 text-right">Solde Dû</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 font-mono-nums">
                {filteredSales.map((s, idx) => (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-blue-50/30 hover:bg-blue-50/70'}>
                    <td className="py-2 px-3 text-slate-700 font-sans">{formatDate(s.createdAt)}</td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-950">{s.saleNumber}</td>
                    <td className="py-2 px-3 text-slate-950 font-bold font-sans">{s.clientName}</td>
                    <td className="py-2 px-3 text-right font-black text-slate-950">${s.totalUSD.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">${s.amountPaidUSD.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-rose-700 font-bold">
                      {s.remainingDebtUSD > 0 ? `$${s.remainingDebtUSD.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                        s.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : s.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {s.paymentStatus === 'PAID' ? 'PAYÉE' : s.paymentStatus === 'PARTIAL' ? 'ACOMPTE' : 'NON PAYÉE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Notes */}
          <div className="mt-8 pt-4 border-t border-blue-200 flex justify-between text-[11px] text-slate-500">
            <span>Document certifié conforme émis par {settings.name}</span>
            <span>Page 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
