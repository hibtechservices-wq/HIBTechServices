import React from 'react';
import { Sale, Client, CompanySettings } from '../../types';
import { formatDate, formatDateTime, getPaymentMethodLabel, getStatusBadge } from '../../utils/formatters';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Gauge,
  CreditCard,
  FileText,
} from 'lucide-react';

interface InvoiceDocumentA4Props {
  sale: Sale;
  client?: Client;
  settings: CompanySettings;
  rate?: number;
  includeGauge?: boolean;
  includeSignature?: boolean;
  includeStamp?: boolean;
  includeCashPaidStamp?: boolean;
  includeLogo?: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const InvoiceDocumentA4: React.FC<InvoiceDocumentA4Props> = ({
  sale,
  client: propClient,
  settings,
  rate: propRate,
  includeGauge = true,
  includeSignature = true,
  includeStamp = true,
  includeCashPaidStamp = false,
  includeLogo = true,
  containerRef,
}) => {
  const client = propClient || {
    id: sale.clientId,
    name: sale.clientName,
    phone: sale.clientPhone,
    address: sale.clientAddress,
    type: 'INDIVIDUAL' as const,
    totalSpentUSD: 0,
    outstandingDebtUSD: 0,
    city: 'Lubumbashi',
    createdAt: '',
  };

  const isQuote = sale.type === 'QUOTE_PROFORMA';
  const isReceipt = sale.type === 'RECEIPT';
  const rate = propRate || sale.exchangeRate || settings.exchangeRateUSD_CDF || 2850;

  // Dynamic density calculation
  const itemCount = sale.items.length;
  const isCompact = itemCount >= 7;
  const isUltraCompact = itemCount >= 14;

  // Calculation for Financial Gauge
  const totalUSD = sale.totalUSD || 0;
  const amountPaidUSD = sale.amountPaidUSD || 0;
  const remainingDebtUSD = sale.remainingDebtUSD || Math.max(0, totalUSD - amountPaidUSD);
  const percentPaid = totalUSD > 0 ? Math.min(100, Math.max(0, Math.round((amountPaidUSD / totalUSD) * 100))) : 100;
  const isFullyPaid = percentPaid >= 100 || remainingDebtUSD <= 0.01;
  const isPartiallyPaid = percentPaid > 0 && !isFullyPaid;
  const isUnpaid = percentPaid === 0;

  // Semicircular vector arc math for SVG gauge: radius=46, cx=60, cy=56
  const arcLength = Math.PI * 46; // ~144.51
  const strokeOffset = arcLength - (arcLength * percentPaid) / 100;

  const paidCDF = Math.round(amountPaidUSD * rate);
  const remainingCDF = Math.round(remainingDebtUSD * rate);

  return (
    <div
      ref={containerRef}
      className={`print-page bg-white w-[794px] min-w-[794px] ${
        isUltraCompact ? 'p-4 text-[11px]' : isQuote ? 'p-5 text-xs' : isCompact ? 'p-6 text-xs' : 'p-7 text-xs'
      } shadow-lg rounded-xl border border-blue-200 text-slate-900 leading-normal shrink-0`}
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      {/* Entête Bleu & Blanc Prestige */}
      <div
        className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-5 rounded-xl border-b-4 border-blue-500 shadow-xs mb-3.5"
        style={{ backgroundColor: '#0f2942', color: '#ffffff' }}
      >
        <div className="flex flex-row justify-between items-start gap-4">
          {/* Left: Logo & Company details */}
          <div className="flex items-start gap-3.5">
            {includeLogo && settings.logoUrl ? (
              <div className="shrink-0 bg-white p-1.5 rounded-lg border border-blue-200 shadow-sm">
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className={`${isUltraCompact ? 'h-11 max-w-[85px]' : isCompact ? 'h-13 max-w-[105px]' : 'h-16 max-w-[130px]'} object-contain`}
                />
              </div>
            ) : (
              <div className="w-13 h-13 rounded-xl bg-white text-blue-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-blue-300 shrink-0">
                <span className="text-blue-900 font-extrabold tracking-tighter">CB</span>
              </div>
            )}
            <div>
              <h1 className={`${isUltraCompact ? 'text-lg font-black' : isCompact ? 'text-xl font-black' : 'text-2xl font-black'} tracking-tight text-white uppercase`}>
                {settings.name}
              </h1>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                {settings.slogan}
              </p>
              <p className="text-[11px] text-blue-200 mt-1 leading-tight">
                {settings.address}, {settings.city} · RDC · Tél: <span className="font-mono-nums font-bold text-white">{settings.phone1}</span> {settings.phone2 ? `| ${settings.phone2}` : ''}
              </p>
              {settings.email && (
                <p className="text-[11px] text-blue-200">
                  Email : <span className="text-white font-medium">{settings.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Document Title & Reference Badges */}
          <div className="text-right w-auto shrink-0 space-y-1">
            <div
              className="inline-block bg-white text-blue-950 font-black text-xs sm:text-sm uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-sm border border-blue-200"
              style={{ backgroundColor: '#ffffff', color: '#0f2942' }}
            >
              {isQuote ? 'DEVIS PROFORMA' : isReceipt ? 'REÇU D\'ENCAISSEMENT' : 'FACTURE COMMERCIALE'}
            </div>
            <div className="space-y-0.5 font-mono-nums text-xs">
              <p className="font-black text-base text-white tracking-tight">{sale.saleNumber}</p>
              {sale.dgiNfu && (
                <p className="text-[11px] text-blue-200">
                  Réf. DGI : <span className="font-bold text-white bg-blue-800/80 px-1.5 py-0.5 rounded">{sale.dgiNfu}</span>
                </p>
              )}
              <p className="text-blue-200 text-[11px]">
                Date : <span className="text-white font-bold">{formatDateTime(sale.createdAt)}</span>
              </p>
              {sale.dueDate && (
                <p className="text-amber-300 font-bold text-[11px]">
                  Échéance : {formatDate(sale.dueDate)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cadres Identifiants Émetteur & Client (Bleu & Blanc) */}
      <div className={`grid grid-cols-2 gap-3.5 ${isUltraCompact ? 'my-2 text-[10px]' : isCompact ? 'my-2.5 text-xs' : 'my-3 text-xs'}`}>
        {/* Émetteur Fiscal */}
        <div className="rounded-xl border-2 border-blue-200 bg-white overflow-hidden shadow-2xs">
          <div
            className="bg-blue-900 text-white font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 flex items-center justify-between"
            style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
          >
            <span>Identifiants de l'Émetteur</span>
            <span className="text-blue-200 text-[9px] font-normal">{settings.city || 'Lubumbashi'} / RDC</span>
          </div>
          <div className="p-3 space-y-1 text-slate-800">
            <p><span className="text-blue-900 font-bold">NIF :</span> <span className="font-mono-nums font-bold text-slate-950">{settings.nif || 'NIF-NON-DEFINI'}</span> · <span className="text-blue-900 font-bold">RCCM :</span> <span className="font-mono-nums font-bold text-slate-900">{settings.rccm}</span></p>
            <p><span className="text-blue-900 font-bold">Id. Nat :</span> <span className="font-mono-nums font-bold text-slate-900">{settings.idNat}</span> · <span className="text-blue-900 font-bold">Régime :</span> <span className="font-bold text-slate-900">{settings.dgiRegime || 'Régime Général'}</span></p>
            {sale.dgiTerminalId && (
              <p><span className="text-blue-900 font-bold">N° Terminal DEF :</span> <span className="font-mono-nums font-bold text-slate-800">{sale.dgiTerminalId}</span></p>
            )}
          </div>
        </div>

        {/* Client Acheteur */}
        <div className="rounded-xl border-2 border-blue-200 bg-white overflow-hidden shadow-2xs">
          <div
            className="bg-blue-800 text-white font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 flex items-center justify-between"
            style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
          >
            <span>Facturé au Client (Acheteur)</span>
            <span className="text-blue-200 text-[9px] font-normal">{client.type === 'COMPANY' ? 'Entreprise' : 'Particulier'}</span>
          </div>
          <div className="p-3 space-y-1 text-slate-800">
            <p className="font-black text-blue-950 text-sm leading-tight">{sale.clientName}</p>
            <p><span className="text-blue-900 font-bold">NIF / ID :</span> <span className="font-mono-nums font-bold text-slate-950">{sale.clientNif || client.nif || client.rccmOrNif || 'Consommateur final'}</span></p>
            <p><span className="text-blue-900 font-bold">Contact :</span> <span className="font-mono-nums font-bold text-slate-950">{sale.clientPhone || client.phone || 'Non renseigné'}</span></p>
            {sale.clientAddress && (
              <p className="truncate"><span className="text-blue-900 font-bold">Adresse :</span> <span className="font-medium text-slate-700">{sale.clientAddress}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des Articles & Prestations (Bleu & Blanc Haute Lisibilité) */}
      <div className={`overflow-x-auto rounded-xl border-2 border-blue-200 ${isUltraCompact ? 'my-1.5' : isCompact ? 'my-2' : 'my-3'} shadow-2xs`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr
              className="bg-blue-900 text-white font-bold uppercase tracking-wider text-[10px]"
              style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
            >
              <th className={`${isUltraCompact ? 'py-1.5 px-2.5' : isCompact ? 'py-2 px-3' : 'py-2.5 px-3.5'}`}>Réf / Désignation</th>
              <th className={`${isUltraCompact ? 'py-1.5 px-1.5' : isCompact ? 'py-2 px-2' : 'py-2.5 px-2'} text-center w-20`}>Gr. TVA</th>
              <th className={`${isUltraCompact ? 'py-1.5 px-2' : isCompact ? 'py-2 px-2.5' : 'py-2.5 px-3'} text-center w-24`}>Quantité</th>
              <th className={`${isUltraCompact ? 'py-1.5 px-2' : isCompact ? 'py-2 px-2.5' : 'py-2.5 px-3'} text-right w-28`}>Prix Unit. HT ($)</th>
              <th className={`${isUltraCompact ? 'py-1.5 px-2' : isCompact ? 'py-2 px-2.5' : 'py-2.5 px-3'} text-right w-28`}>Total HT ($)</th>
              <th className={`${isUltraCompact ? 'py-1.5 px-2' : isCompact ? 'py-2 px-2.5' : 'py-2.5 px-3'} text-right w-28`}>
                {sale.taxPercent > 0 ? `TVA ${sale.taxPercent}% ($)` : 'TVA ($)'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100 font-mono-nums">
            {sale.items.map((item, idx) => {
              const itemTaxAmount = item.taxGroup === 'A' && sale.taxPercent > 0 ? (item.subtotalUSD * 0.16) : 0;
              const isEven = idx % 2 === 0;
              return (
                <tr key={idx} className={isEven ? 'bg-white hover:bg-blue-50/50' : 'bg-blue-50/30 hover:bg-blue-50/70'}>
                  <td className={`${isUltraCompact ? 'py-1 px-2.5 text-[10px]' : isCompact ? 'py-1.5 px-3 text-[11px]' : 'py-2 px-3.5 text-xs'} font-sans`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-950 leading-tight">{item.name}</span>
                      {item.code && <span className="text-[9px] text-blue-700 font-mono font-semibold">({item.code})</span>}
                    </div>
                  </td>
                  <td className={`${isUltraCompact ? 'py-1 px-1.5 text-[9px]' : isCompact ? 'py-1.5 px-2 text-[10px]' : 'py-2 px-2 text-[11px]'} text-center`}>
                    <span className="font-black text-blue-900 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                      Gr. {item.taxGroup || 'A'}
                    </span>
                  </td>
                  <td className={`${isUltraCompact ? 'py-1 px-2 text-[10px]' : isCompact ? 'py-1.5 px-2.5 text-[11px]' : 'py-2 px-3 text-xs'} text-center font-extrabold text-blue-950`}>
                    {item.quantity} <span className="text-slate-500 font-normal">{item.unit}</span>
                  </td>
                  <td className={`${isUltraCompact ? 'py-1 px-2 text-[10px]' : isCompact ? 'py-1.5 px-2.5 text-[11px]' : 'py-2 px-3 text-xs'} text-right font-semibold text-slate-900`}>
                    ${item.unitPriceUSD.toFixed(2)}
                  </td>
                  <td className={`${isUltraCompact ? 'py-1 px-2 text-[10px]' : isCompact ? 'py-1.5 px-2.5 text-[11px]' : 'py-2 px-3 text-xs'} text-right font-black text-blue-950`}>
                    ${item.subtotalUSD.toFixed(2)}
                  </td>
                  <td className={`${isUltraCompact ? 'py-1 px-2 text-[10px]' : isCompact ? 'py-1.5 px-2.5 text-[11px]' : 'py-2 px-3 text-xs'} text-right font-semibold text-slate-700`}>
                    ${itemTaxAmount.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= LA JAUGE DE RÈGLEMENT ET SOLVABILITÉ (UNIQUEMENT FACTURES/REÇUS) ================= */}
      {!isQuote && includeGauge && (
        <div className={`my-2.5 ${isUltraCompact ? 'p-2 text-[10px]' : isCompact ? 'p-2.5 text-[11px]' : 'p-3 text-xs'} bg-gradient-to-br from-blue-50/90 via-white to-sky-50/60 rounded-xl border-2 border-blue-200 shadow-2xs`}>
          {/* Gauge Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Gauge className="w-3.5 h-3.5 text-sky-300" />
              </div>
              <div>
                <span className="font-black text-blue-950 uppercase tracking-wider text-[11px] block leading-none">
                  Jauge de Règlement & Situation Financière
                </span>
                <span className="text-[10px] text-blue-700 font-medium">
                  Indicateur officiel de perception & quittance de paiement
                </span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {isFullyPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>SOLDÉ À 100% (QUITTANCE TOTALE)</span>
                </span>
              )}
              {isPartiallyPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  <AlertCircle className="w-3 h-3 text-amber-700" />
                  <span>ACOMPTE : {percentPaid}% RÉGLÉ (SOLDE RESTANT)</span>
                </span>
              )}
              {isUnpaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                  <AlertCircle className="w-3 h-3 text-rose-700" />
                  <span>NON RÉGLÉ : 0% ENCAISSÉ (CRÉANCE)</span>
                </span>
              )}
            </div>
          </div>

          {/* Gauge Display with Vector Semicircle Speedometer */}
          <div className={`grid grid-cols-12 gap-3 items-center ${isUltraCompact ? 'pt-1.5' : 'pt-2'}`}>
            {/* Visual Vector Speedometer Arc (3 Cols) */}
            <div className="col-span-3 flex flex-col items-center justify-center bg-white p-1 rounded-lg border border-blue-200 shadow-2xs">
              <svg viewBox="0 0 120 70" className="w-24 h-14 overflow-visible">
                {/* Background Track Arc */}
                <path
                  d="M 14 58 A 46 46 0 0 1 106 58"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                {/* Progress Arc */}
                <path
                  d="M 14 58 A 46 46 0 0 1 106 58"
                  fill="none"
                  stroke={isFullyPaid ? '#10b981' : isPartiallyPaid ? '#2563eb' : '#f43f5e'}
                  strokeWidth="9"
                  strokeDasharray={`${arcLength} ${arcLength}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                />
                {/* Center Readout */}
                <text
                  x="60"
                  y="48"
                  textAnchor="middle"
                  className="font-mono font-black text-[16px] fill-slate-950"
                >
                  {percentPaid}%
                </text>
                <text
                  x="60"
                  y="59"
                  textAnchor="middle"
                  className="font-sans font-bold text-[7px] uppercase tracking-wider fill-blue-900"
                >
                  {isFullyPaid ? 'ACQUITTÉ' : isPartiallyPaid ? 'ENCAISSÉ' : 'À RÉGLER'}
                </text>
                {/* Ticks */}
                <text x="14" y="68" textAnchor="start" className="font-mono text-[7px] fill-slate-500 font-bold">0%</text>
                <text x="60" y="8" textAnchor="middle" className="font-mono text-[7px] fill-slate-500 font-bold">50%</text>
                <text x="106" y="68" textAnchor="end" className="font-mono text-[7px] fill-slate-500 font-bold">100%</text>
              </svg>
              <span className="text-[9px] font-black text-blue-900 mt-0.5">
                Jauge de Paiement
              </span>
            </div>

            {/* Multi-step progress bar and financial amounts (9 Cols) */}
            <div className="col-span-9 space-y-2">
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-1">
                  <span className="text-blue-950 font-bold flex items-center gap-1">
                    Taux de Règlement : <strong className="font-mono font-black text-blue-800">{percentPaid}%</strong>
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">
                    Montant Facturé : <strong className="text-slate-950">${totalUSD.toFixed(2)}</strong> ({new Intl.NumberFormat('fr-FR').format(sale.totalCDF)} FC)
                  </span>
                </div>

                {/* High-Definition Progress Bar */}
                <div className="relative h-3.5 bg-slate-200 rounded-full overflow-hidden border border-blue-200 shadow-inner">
                  <div
                    className={`h-full rounded-full ${
                      isFullyPaid
                        ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-500'
                        : isPartiallyPaid
                        ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, percentPaid)}%` }}
                  />
                </div>
              </div>

              {/* Dual Financial Boxes */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-nums">
                {/* Montant Payé */}
                <div className="bg-white p-2 rounded-lg border border-blue-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-blue-900 font-bold block">
                      Montant Encaissé (Payé)
                    </span>
                    <span className="text-xs font-black text-emerald-700">
                      ${amountPaidUSD.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {new Intl.NumberFormat('fr-FR').format(paidCDF)} FC
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {percentPaid}%
                  </span>
                </div>

                {/* Solde Restant */}
                <div className={`p-2 rounded-lg border flex items-center justify-between shadow-2xs ${
                  remainingDebtUSD > 0.01
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-white border-blue-200 text-slate-800'
                }`}>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-bold block text-slate-700">
                      Solde Restant à Payer
                    </span>
                    <span className={`text-xs font-black ${remainingDebtUSD > 0.01 ? 'text-rose-700' : 'text-slate-900'}`}>
                      ${remainingDebtUSD.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {new Intl.NumberFormat('fr-FR').format(remainingCDF)} FC
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    remainingDebtUSD > 0.01
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {100 - percentPaid}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tableau de Ventilation Fiscale (Bleu & Blanc) */}
      <div className={`${isUltraCompact ? 'my-1.5 p-2 text-[10px]' : isCompact ? 'my-2 p-2.5 text-[11px]' : 'my-2.5 p-3 text-xs'} bg-white rounded-xl border-2 border-blue-200 shadow-2xs`}>
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-blue-100">
          <span className="font-black text-blue-950 uppercase tracking-wider text-[10px]">
            Ventilation de la TVA (Direction Générale des Impôts - RDC)
          </span>
          <span className="text-[10px] text-blue-700 font-bold font-mono">Taux Standard: 16%</span>
        </div>
        <table className="w-full text-[10px] font-mono-nums border-collapse">
          <thead>
            <tr className="bg-blue-50 text-blue-950 uppercase font-bold text-[9px]">
              <th className="text-left py-1 px-2">Groupe Fiscal</th>
              <th className="text-right py-1 px-2">Base HT ($)</th>
              <th className="text-right py-1 px-2">Taux TVA</th>
              <th className="text-right py-1 px-2">Montant TVA ($)</th>
              <th className="text-right py-1 px-2">Total TTC ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            <tr>
              <td className="py-1 px-2 font-sans font-bold text-slate-900">
                {sale.taxPercent > 0 ? `Groupe A : Taux Standard TVA ${sale.taxPercent}%` : 'Vente Hors TVA / Non-assujetti (0%)'}
              </td>
              <td className="py-1 px-2 text-right font-semibold text-slate-800">${(sale.dgiVatBreakdown?.groupA?.baseUSD || sale.subtotalUSD).toFixed(2)}</td>
              <td className="py-1 px-2 text-right font-bold text-blue-900">{sale.taxPercent}%</td>
              <td className="py-1 px-2 text-right font-black text-blue-950">${sale.taxAmountUSD.toFixed(2)}</td>
              <td className="py-1 px-2 text-right font-black text-slate-950">${sale.totalUSD.toFixed(2)}</td>
            </tr>
            {sale.dgiVatBreakdown?.groupC?.baseUSD > 0 && (
              <tr>
                <td className="py-1 px-2 font-sans text-slate-700">Groupe C : Exonéré (Loi de Finances)</td>
                <td className="py-1 px-2 text-right font-semibold text-slate-800">${sale.dgiVatBreakdown.groupC.baseUSD.toFixed(2)}</td>
                <td className="py-1 px-2 text-right">0%</td>
                <td className="py-1 px-2 text-right">$0.00</td>
                <td className="py-1 px-2 text-right font-bold text-slate-900">${sale.dgiVatBreakdown.groupC.baseUSD.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totaux & Dispositif d'Authentification / QR Code */}
      <div className={`grid grid-cols-12 gap-3.5 ${isUltraCompact ? 'pt-1.5' : 'pt-2.5'} border-t-2 border-blue-900 items-start`}>
        {/* Bloc Gauche (7 Cols) : Conditions Proforma OU Sceau DGI Facture */}
        {isQuote ? (
          <div className={`col-span-7 flex gap-3.5 ${isUltraCompact ? 'p-2' : 'p-3'} bg-blue-50/60 rounded-xl border-2 border-blue-200 shadow-2xs`}>
            <div className="shrink-0 bg-white p-1.5 rounded-lg border-2 border-blue-300 shadow-sm flex flex-col items-center justify-center">
              <QRCodeSVG
                value={`PROFORMA|${sale.saleNumber}|${sale.totalUSD}|${settings.name}`}
                size={isUltraCompact ? 68 : isCompact ? 76 : 84}
                level="M"
              />
              <span className="block text-[8px] font-black text-center mt-1 text-blue-900 font-mono">
                DEVIS PROFORMA
              </span>
            </div>

            <div className="space-y-1 text-[10px] font-mono-nums text-slate-800 flex-1">
              <div className="flex items-center gap-1.5 text-blue-950 font-sans font-black text-[11px] pb-1 border-b border-blue-200">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Conditions & Validité de l'Offre</span>
              </div>
              <p><span className="text-blue-900 font-bold font-sans">Validité de l'Offre :</span> <strong className="text-emerald-800 font-bold">{sale.dueDate ? formatDate(sale.dueDate) : '30 jours'}</strong></p>
              <p><span className="text-blue-900 font-bold font-sans">Délai d'exécution :</span> <span className="text-slate-900">Immédiat sous réserve de stock</span></p>
              <p><span className="text-blue-900 font-bold font-sans">Taux du Jour :</span> 1 USD = <strong className="text-slate-950">{rate.toLocaleString('fr-FR')} CDF</strong></p>
              <p className="text-[9px] text-slate-500 font-sans italic pt-0.5 leading-tight">
                * Document commercial indicatif émis pour accord préalable. Ne constitue pas une facture définitive ouvrant droit à déduction fiscale avant paiement.
              </p>
            </div>
          </div>
        ) : (
          <div className={`col-span-7 flex gap-3.5 ${isUltraCompact ? 'p-2' : 'p-3'} bg-white rounded-xl border-2 border-blue-200 shadow-2xs`}>
            <div className="shrink-0 bg-white p-1.5 rounded-lg border-2 border-blue-300 shadow-sm flex flex-col items-center">
              <QRCodeSVG
                value={sale.dgiQrPayload || `DOC-RDC|${sale.saleNumber}|${sale.totalUSD}|${sale.dgiSecurityCode}`}
                size={isUltraCompact ? 68 : isCompact ? 80 : 96}
                level="M"
              />
              <span className="block text-[8px] font-black text-center mt-1 text-blue-900 font-mono">
                DGI RDC · SFN
              </span>
            </div>

            <div className="space-y-0.5 text-[10px] font-mono-nums text-slate-800">
              <div className="flex items-center gap-1.5 text-blue-950 font-sans font-black text-[11px] pb-1 border-b border-blue-100">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Sceau & Sécurité Fiscale DGI</span>
              </div>
              <p><span className="text-blue-900 font-bold font-sans">NFU :</span> <span className="font-bold text-slate-950">{sale.dgiNfu || 'SFN-00000'}</span></p>
              <p><span className="text-blue-900 font-bold font-sans">CS :</span> <span className="font-bold text-blue-800">{sale.dgiSecurityCode}</span></p>
              <p><span className="text-blue-900 font-bold font-sans">N° Trans :</span> <span className="font-bold text-emerald-800">{sale.dgiReceiptNumber || 'REC-2026-0049281'}</span></p>
              <p><span className="text-blue-900 font-bold font-sans">Compteur Fiscal :</span> #{sale.dgiFiscalCounter || 1001}</p>
              <p><span className="text-blue-900 font-bold font-sans">Taux du Jour :</span> 1 USD = <strong className="text-slate-950">{rate.toLocaleString('fr-FR')} CDF</strong></p>
            </div>
          </div>
        )}

        {/* Totaux Financiers (5 Cols) */}
        <div className={`col-span-5 ${isUltraCompact ? 'space-y-1 p-2.5 text-[11px]' : 'space-y-1.5 p-3.5 text-xs'} font-mono-nums bg-white rounded-xl border-2 border-blue-200 shadow-2xs`}>
          <div className="flex justify-between text-slate-700 font-medium">
            <span className="font-sans">Total HT :</span>
            <span className="font-bold text-slate-900">${sale.subtotalUSD.toFixed(2)}</span>
          </div>

          {sale.discountUSD > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span className="font-sans">Remise :</span>
              <span>-${sale.discountUSD.toFixed(2)}</span>
            </div>
          )}

          {sale.taxPercent > 0 ? (
            <div className="flex justify-between text-blue-900 font-medium">
              <span className="font-sans">TVA ({sale.taxPercent}%) :</span>
              <span className="font-bold">+${sale.taxAmountUSD.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-slate-500 text-[11px] italic font-sans">
              <span>TVA :</span>
              <span>0.00 $ (Non applicable)</span>
            </div>
          )}

          {/* Grand Total TTC USD Banner */}
          <div
            className="bg-blue-900 text-white p-2 rounded-lg flex justify-between items-center font-black text-sm shadow-xs mt-1"
            style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
          >
            <span className="font-sans uppercase tracking-wider text-xs text-blue-200">TOTAL TTC ($)</span>
            <span className="text-base text-white">${sale.totalUSD.toFixed(2)}</span>
          </div>

          {/* Grand Total TTC CDF Badge */}
          <div className="bg-blue-50 border border-blue-300 text-blue-950 px-2 py-1 rounded-md flex justify-between items-center font-bold text-xs">
            <span className="font-sans uppercase text-[10px] text-blue-800">TOTAL (CDF)</span>
            <span className="font-mono">{new Intl.NumberFormat('fr-FR').format(sale.totalCDF)} FC</span>
          </div>

          {isQuote ? (
            <div className="border-t border-blue-200 pt-1 text-[10px] space-y-0.5 text-blue-950 font-medium">
              <div className="flex justify-between">
                <span className="font-sans">Nature :</span>
                <span className="font-bold text-blue-900">Offre Commerciale</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Échéance offre :</span>
                <span className="font-mono">{sale.dueDate ? formatDate(sale.dueDate) : '30 jours'}</span>
              </div>
            </div>
          ) : (
            <div className="border-t border-blue-200 pt-1 text-[11px] space-y-0.5">
              <div className="flex justify-between text-slate-700">
                <span className="font-sans">Encaissé :</span>
                <span className="font-bold text-emerald-700">${sale.amountPaidUSD.toFixed(2)}</span>
              </div>
              {sale.remainingDebtUSD > 0 && (
                <div className="flex justify-between font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px]">
                  <span className="font-sans">SOLDE RESTANT DÛ :</span>
                  <span>${sale.remainingDebtUSD.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Règlement Mobile Money & Banques RDC (Bleu & Blanc) */}
      <div className={`mt-2.5 ${isUltraCompact ? 'p-1.5 text-[9px]' : 'p-2.5 text-[10px]'} bg-blue-50/50 rounded-xl border-2 border-blue-200`}>
        <span className="font-black text-blue-950 uppercase block mb-1 text-[9px] flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-blue-700" />
          <span>Coordonnées de Règlement Autorisées (Mobile Money & Banques RDC)</span>
        </span>
        <div className="grid grid-cols-2 gap-2 text-slate-800">
          <div>
            {settings.mpesaNumber && <p>• <span className="font-bold text-blue-900">M-Pesa :</span> {settings.mpesaNumber} ({settings.mpesaName})</p>}
            {settings.orangeMoneyNumber && <p>• <span className="font-bold text-blue-900">Orange Money :</span> {settings.orangeMoneyNumber}</p>}
            {settings.airtelMoneyNumber && <p>• <span className="font-bold text-blue-900">Airtel Money :</span> {settings.airtelMoneyNumber}</p>}
          </div>
          <div>
            {settings.bankDetails && <p>• <span className="font-bold text-blue-900">Banque :</span> {settings.bankDetails}</p>}
          </div>
        </div>
      </div>

      {/* Signatures & Visa Entreprise */}
      <div className={`mt-2.5 ${isUltraCompact ? 'pt-1.5' : 'pt-2.5'} border-t border-blue-200 grid grid-cols-2 text-center text-xs text-slate-700 items-start`}>
        {/* Client / Réceptionnaire */}
        <div className="flex flex-col items-center">
          <p className={`font-bold text-blue-950 ${isUltraCompact ? 'mb-2' : isCompact ? 'mb-3' : 'mb-6'}`}>
            {isQuote ? 'Bon pour accord du Client' : 'Visa du Client / Réceptionnaire'}
          </p>
          <div className={`${isUltraCompact ? 'h-10' : 'h-14'} flex items-end justify-center`}>
            <p className="text-[9px] text-slate-400">Date, Mention & Signature</p>
          </div>
        </div>

        {/* Visa Entreprise (Pour Congo Tech / Entreprise) */}
        <div className="flex flex-col items-center relative">
          <p className={`font-bold text-blue-950 ${isUltraCompact ? 'mb-1' : 'mb-1.5'}`}>
            {settings.signatoryTitle || `Pour ${settings.name}`}
          </p>

          {/* Container for Stamp & Signature */}
          <div className={`relative ${isUltraCompact ? 'h-14' : isCompact ? 'h-16' : 'h-20'} w-full flex items-center justify-center`}>
            {/* Sceau / Cachet Officiel */}
            {includeStamp && settings.stampUrl && (
              <img
                src={settings.stampUrl}
                alt="Sceau officiel"
                className={`absolute ${isUltraCompact ? 'w-14 h-14' : isCompact ? 'w-16 h-16' : 'w-20 h-20'} object-contain -rotate-6 pointer-events-none select-none`}
                style={{ mixBlendMode: 'multiply' }}
              />
            )}

            {/* Cachet PAYÉ CASH / COMPTANT (Jamais sur Devis Proforma) */}
            {!isQuote && includeCashPaidStamp && settings.cashPaidStampUrl && (
              <img
                src={settings.cashPaidStampUrl}
                alt="Cachet Payé Cash"
                className={`absolute ${isUltraCompact ? 'w-40 h-20 -top-3' : isCompact ? 'w-48 h-24 -top-4' : 'w-56 h-28 -top-5'} object-contain -rotate-12 pointer-events-none select-none z-20 drop-shadow-md`}
                style={{ mixBlendMode: 'multiply' }}
              />
            )}

            {/* Signature Autorisée */}
            {includeSignature && settings.signatureUrl && (
              <img
                src={settings.signatureUrl}
                alt="Signature autorisée"
                className={`relative z-10 ${isUltraCompact ? 'h-10 max-w-[130px]' : isCompact ? 'h-12 max-w-[150px]' : 'h-14 max-w-[180px]'} object-contain pointer-events-none select-none`}
              />
            )}

            {!includeStamp && !includeSignature && (!includeCashPaidStamp || isQuote) && (
              <div className="h-full flex items-center justify-center">
                <span className="text-[9px] text-slate-400 italic">
                  {isQuote ? '(Signature Autorisée)' : '(Cachet & Signature Autorisée)'}
                </span>
              </div>
            )}
          </div>

          <p className="text-[9px] text-blue-900 font-bold mt-0.5">
            {settings.signatoryName || 'Direction Commerciale'}
          </p>
        </div>
      </div>

      {/* Mentions de bas de page */}
      <div className={`mt-2 text-center ${isUltraCompact ? 'text-[8px] pt-1' : 'text-[9px] pt-1.5'} text-slate-500 border-t border-blue-100 leading-tight`}>
        {settings.invoiceFooterNotes || 'Merci pour votre confiance. Document certifié conforme par la Direction Générale des Impôts (RDC).'}
      </div>
    </div>
  );
};
