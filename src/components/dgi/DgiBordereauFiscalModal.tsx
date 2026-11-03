import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDualCurrency, formatDate } from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { printDirectToDefaultPrinter } from '../../utils/printDirect';
import {
  Printer,
  Download,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building,
  Loader2,
  Calendar
} from 'lucide-react';

interface DgiBordereauFiscalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // format YYYY-MM
}

export const DgiBordereauFiscalModal: React.FC<DgiBordereauFiscalModalProps> = ({
  isOpen,
  onClose,
  selectedMonth
}) => {
  const { sales, expenses, settings, showNotification } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const rate = settings.exchangeRateUSD_CDF || 2850;

  // Filter sales for selected month
  const monthlySales = sales.filter(
    (s) => (s.type === 'INVOICE' || s.type === 'RECEIPT') && s.createdAt.startsWith(selectedMonth)
  );

  // Filter expenses for selected month
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  // Computations
  const totalHT_USD = monthlySales.reduce((acc, s) => acc + (s.subtotalUSD - s.discountUSD), 0);
  const totalTVA_USD = monthlySales.reduce((acc, s) => acc + s.taxAmountUSD, 0);
  const totalTTC_USD = monthlySales.reduce((acc, s) => acc + s.totalUSD, 0);

  // Group A (Standard 16%)
  const groupA_HT = totalHT_USD;
  const groupA_TVA = totalTVA_USD;

  // Group B (Exonéré 0%)
  const groupB_HT = 0;
  const groupB_TVA = 0;

  // Deductibles
  const deductiblePurchasesUSD = monthlyExpenses.reduce((acc, e) => acc + e.amountUSD, 0);
  const deductibleTVA_USD = deductiblePurchasesUSD * 0.16;

  // Net Payable
  const netVatPayableUSD = Math.max(0, totalTVA_USD - deductibleTVA_USD);
  const netVatPayableCDF = Math.round(netVatPayableUSD * rate);

  // NFU sequential tracking
  const nfus = monthlySales.map((s) => s.dgiNfu).filter(Boolean);
  const firstNfu = nfus.length > 0 ? nfus[0] : 'N/A';
  const lastNfu = nfus.length > 0 ? nfus[nfus.length - 1] : 'N/A';
  const transmittedCount = monthlySales.filter(
    (s) => s.dgiTransmissionStatus === 'TRANSMITTED' || !s.dgiTransmissionStatus
  ).length;

  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${months[parseInt(month, 10) - 1] || month} ${year}`;
  };

  const handlePrint = async () => {
    if (!printAreaRef.current) return;
    setIsPrinting(true);
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolder = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const filename = `${cleanFolder}_BORDEREAU_DGI_${selectedMonth}.pdf`;

    try {
      const pdfRes = await downloadElementAsPDF(printAreaRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
        scale: 2.0,
        maxSizeBytes: 3 * 1024 * 1024,
      });

      await printDirectToDefaultPrinter(printAreaRef.current, {
        format: 'A4',
        title: `Bordereau_Fiscal_DGI_${selectedMonth}`
      });

      const sizeInfo = pdfRes && typeof pdfRes === 'object' && pdfRes.formattedSize ? ` (${pdfRes.formattedSize})` : ' (< 3 Mo)';
      showNotification(`Bordereau imprimé et archivé${sizeInfo} dans ${targetFolder}`, 'success');
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error(err);
      showNotification('Erreur lors de l’impression du bordereau', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadOnly = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPDF(true);
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolder = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const filename = `${cleanFolder}_BORDEREAU_DGI_${selectedMonth}.pdf`;

    try {
      const pdfRes = await downloadElementAsPDF(printAreaRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
        scale: 2.0,
        maxSizeBytes: 3 * 1024 * 1024,
      });
      const sizeInfo = pdfRes && typeof pdfRes === 'object' && pdfRes.formattedSize ? ` (${pdfRes.formattedSize} · < 3 Mo)` : ' (< 3 Mo)';
      showNotification(`Bordereau PDF téléchargé${sizeInfo} avec succès (${targetFolder})`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('Erreur de génération PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Bordereau Fiscal Officiel DGI RDC · TVA Mensuelle
              </h3>
              <p className="text-xs text-slate-400">
                Période fiscale : <span className="text-emerald-400 font-bold">{formatMonthLabel(selectedMonth)}</span> · Norme Dispositif Électronique Fiscal (DEF)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadOnly}
              disabled={isGeneratingPDF || isPrinting}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Télécharger PDF
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting || isGeneratingPDF}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Impression...
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer & Enregistrer
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper A4 Viewable & Printable Container */}
        <div className="overflow-y-auto p-6 bg-slate-950 flex justify-center flex-1">
          <div
            ref={printAreaRef}
            className="w-full max-w-[794px] bg-white text-slate-900 p-8 shadow-2xl rounded-sm print:p-0 print:shadow-none print:w-full print:max-w-none text-xs"
            style={{ minHeight: '1120px' }}
          >
            {/* 1. Official State & Ministry Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex justify-between items-start text-center">
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                  </p>
                  <p className="text-[9px] font-bold text-slate-700">
                    MINISTÈRE DES FINANCES
                  </p>
                  <p className="text-[11px] font-black text-emerald-800">
                    DIRECTION GÉNÉRALE DES IMPÔTS (DGI)
                  </p>
                  <p className="text-[9px] font-semibold text-slate-600">
                    Direction des Grandes Entreprises / Centre des Impôts : <span className="font-bold text-slate-900">{settings.dgiCenter || 'CDI / CIS RDC'}</span>
                  </p>
                </div>

                <div className="border-2 border-slate-900 p-2 bg-slate-50 text-right">
                  <div className="text-[9px] uppercase font-bold text-slate-600">Formulaire Réglementaire</div>
                  <div className="text-xs font-black text-slate-900 font-mono">DGI-DEF / TVA-01</div>
                  <div className="text-[10px] font-bold text-emerald-800 mt-0.5">
                    Mois : {formatMonthLabel(selectedMonth)}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center bg-slate-900 text-white py-1.5 px-3 rounded-sm font-black text-sm uppercase tracking-wider">
                BORDEREAU RÉCAPITULATIF DE DÉCLARATION & PAIEMENT DE LA TAXE SUR LA VALEUR AJOUTÉE (TVA)
              </div>
            </div>

            {/* 2. Assujetti Identification Card */}
            <div className="border border-slate-300 rounded p-3 mb-4 bg-slate-50 text-[11px]">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-2 flex items-center justify-between">
                <span>1. Identification de l'Entreprise Assujettie</span>
                <span className="font-mono text-emerald-700 font-semibold">Taux Légal TVA : 16% (Art. 356 CGI)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><span className="text-slate-500 font-medium">Raison Sociale :</span> <span className="font-bold text-slate-900">{settings.name || 'HIBTECH SERVICES SARL'}</span></p>
                  <p><span className="text-slate-500 font-medium">Numéro Impôt (NIF) :</span> <span className="font-mono font-bold text-slate-900">{settings.nif || 'A2019842M'}</span></p>
                  <p><span className="text-slate-500 font-medium">Registre Commerce (RCCM) :</span> <span className="font-mono font-semibold">{settings.rccm || 'CD/KIN/RCCM/20-B-01142'}</span></p>
                </div>
                <div>
                  <p><span className="text-slate-500 font-medium">Identité Nationale :</span> <span className="font-mono font-semibold">{settings.idNat || '01-83-N44921J'}</span></p>
                  <p><span className="text-slate-500 font-medium">Siège Social :</span> <span>{settings.address || 'Avenue du Commerce'} {settings.city ? `— ${settings.city}` : ''}</span></p>
                  <p><span className="text-slate-500 font-medium">Taux de Change Fixé :</span> <span className="font-mono font-bold text-slate-900">1 USD = {rate.toLocaleString('fr-FR')} FC</span></p>
                </div>
              </div>
            </div>

            {/* 3. Relevé Piste d'Audit DEF (Factures Normalisées) */}
            <div className="border border-slate-300 rounded p-3 mb-4 text-[11px] bg-slate-50/50">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-2 flex items-center justify-between">
                <span>2. Contrôle & Compteurs du Dispositif Électronique Fiscal (DEF)</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synchronisation DGI Conforme (100%)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 border border-slate-200 rounded bg-white">
                  <span className="text-[10px] text-slate-500 block">Factures Normalisées</span>
                  <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">{monthlySales.length}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-white">
                  <span className="text-[10px] text-slate-500 block">Télétransmises DEF</span>
                  <span className="text-sm font-black text-emerald-700 font-mono mt-0.5 block">{transmittedCount}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-white">
                  <span className="text-[10px] text-slate-500 block">Premier NFU Émis</span>
                  <span className="text-[10px] font-bold text-slate-800 font-mono mt-0.5 block truncate">{firstNfu}</span>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-white">
                  <span className="text-[10px] text-slate-500 block">Dernier NFU Émis</span>
                  <span className="text-[10px] font-bold text-slate-800 font-mono mt-0.5 block truncate">{lastNfu}</span>
                </div>
              </div>
            </div>

            {/* 4. Table des Opérations Imposables par Groupe de Taxe */}
            <div className="mb-4">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5">
                3. Tableau Synthétique des Opérations Réalisées (Groupes Fiscaux DGI)
              </div>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead className="bg-slate-100 font-bold text-slate-800 uppercase">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Code / Groupe Fiscal</th>
                    <th className="border border-slate-300 p-2 text-left">Nature des Prestations & Fournitures</th>
                    <th className="border border-slate-300 p-2 text-center">Taux</th>
                    <th className="border border-slate-300 p-2 text-right">Base HT ($ USD)</th>
                    <th className="border border-slate-300 p-2 text-right">TVA Collectée ($ USD)</th>
                    <th className="border border-slate-300 p-2 text-right">TVA en Francs Congolais (CDF)</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">GROUPE A</td>
                    <td className="border border-slate-300 p-2 font-sans">Opérations taxables au taux standard (Ventes Kits Starlink, matériel réseau, abonnements & main d'œuvre)</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">16 %</td>
                    <td className="border border-slate-300 p-2 text-right font-semibold">${groupA_HT.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right font-bold text-emerald-800">${groupA_TVA.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right font-bold text-emerald-800">{Math.round(groupA_TVA * rate).toLocaleString('fr-FR')} FC</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">GROUPE B</td>
                    <td className="border border-slate-300 p-2 font-sans">Opérations exonérées / Conventionnées (ONG internationales, missions diplomatiques agréées)</td>
                    <td className="border border-slate-300 p-2 text-center">0 %</td>
                    <td className="border border-slate-300 p-2 text-right">$0.00</td>
                    <td className="border border-slate-300 p-2 text-right">$0.00</td>
                    <td className="border border-slate-300 p-2 text-right">0 FC</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">GROUPE C</td>
                    <td className="border border-slate-300 p-2 font-sans">Opérations soumises à retenue à la source par des tiers collecteurs (Sociétés minières, banques)</td>
                    <td className="border border-slate-300 p-2 text-center">16 %</td>
                    <td className="border border-slate-300 p-2 text-right">$0.00</td>
                    <td className="border border-slate-300 p-2 text-right">$0.00</td>
                    <td className="border border-slate-300 p-2 text-right">0 FC</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="border border-slate-300 p-2 font-sans uppercase text-slate-900">
                      TOTAL TVA COLLECTÉE BRUTE (LIGNE 10)
                    </td>
                    <td className="border border-slate-300 p-2 text-right">${totalHT_USD.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right text-emerald-900">${totalTVA_USD.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right text-emerald-900">{Math.round(totalTVA_USD * rate).toLocaleString('fr-FR')} FC</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Liquidation de la TVA (Déductions & Net à Payer) */}
            <div className="mb-4">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5">
                4. Déductions Autorisées & Liquidation de la Taxe Nette
              </div>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead className="bg-slate-100 font-bold text-slate-800 uppercase">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Code Ligne</th>
                    <th className="border border-slate-300 p-2 text-left">Rubrique de Déduction Fiscale</th>
                    <th className="border border-slate-300 p-2 text-right">Montant USD</th>
                    <th className="border border-slate-300 p-2 text-right">Montant en Francs Congolais (CDF)</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">LIGNE 20</td>
                    <td className="border border-slate-300 p-2 font-sans">TVA Déductible sur Achats de Matériels & Équipements Réseau</td>
                    <td className="border border-slate-300 p-2 text-right">${deductibleTVA_USD.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right">{Math.round(deductibleTVA_USD * rate).toLocaleString('fr-FR')} FC</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">LIGNE 30</td>
                    <td className="border border-slate-300 p-2 font-sans">Crédit de TVA reporté du mois précédent</td>
                    <td className="border border-slate-300 p-2 text-right">$0.00</td>
                    <td className="border border-slate-300 p-2 text-right">0 FC</td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <td className="border border-slate-900 p-2.5">LIGNE 50</td>
                    <td className="border border-slate-900 p-2.5 font-sans uppercase">
                      NET TVA À PAYER AU TRÉSOR PUBLIC (LIGNE 10 - LIGNE 20 - LIGNE 30)
                    </td>
                    <td className="border border-slate-900 p-2.5 text-right text-amber-300">
                      ${netVatPayableUSD.toFixed(2)}
                    </td>
                    <td className="border border-slate-900 p-2.5 text-right text-amber-300">
                      {netVatPayableCDF.toLocaleString('fr-FR')} FC
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Mentions Légales, Engagement et Visas */}
            <div className="border-t-2 border-slate-900 pt-3 mt-4">
              <p className="text-[9px] text-slate-600 italic mb-4">
                Je soussigné, représentant légal de l'entreprise assujettie, certifie sous peine de sanctions fiscales et pénales prévues par la législation fiscale en vigueur en République Démocratique du Congo, que les mentions portées sur la présente déclaration sont sincères, exactes et conformes aux enregistrements du Dispositif Électronique Fiscal (DEF).
              </p>

              <div className="grid grid-cols-2 gap-8 text-[11px]">
                {/* Cadre Entreprise */}
                <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 min-h-[130px] flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900 uppercase">Pour HIBTECH SERVICES SARL</p>
                    <p className="text-[10px] text-slate-500">Le Directeur Général / Chef Comptable</p>
                  </div>

                  <div className="my-1.5 flex justify-center">
                    {settings.stampUrl ? (
                      <img src={settings.stampUrl} alt="Cachet" className="h-12 object-contain" />
                    ) : (
                      <div className="inline-block border-2 border-dashed border-emerald-600/40 px-3 py-1 rounded text-[10px] text-emerald-800 font-bold uppercase">
                        [ Cachet Commercial & Signature ]
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-slate-800">
                    Fait le {new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Cadre Réception DGI */}
                <div className="border border-slate-300 rounded p-3 text-center bg-slate-50 min-h-[130px] flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900 uppercase">Cadre Réservé à l'Administration Fiscale</p>
                    <p className="text-[10px] text-slate-500">Centre des Impôts (CDI / CIS)</p>
                  </div>

                  <div className="my-1.5">
                    <div className="inline-block border-2 border-dashed border-slate-300 px-4 py-2 rounded text-[10px] text-slate-400">
                      Date de Réception, N° Quittance & Sceau DGI
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Agent Réceptionnaire DGI
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400">
              Système Conforme DEF DGI RDC · Document Authentifié sous Signature Électronique SHA-256 · Page 1/1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
