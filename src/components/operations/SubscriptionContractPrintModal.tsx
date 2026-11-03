import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionContract } from '../../types';
import { formatDate } from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { printDirectToDefaultPrinter } from '../../utils/printDirect';
import {
  Printer,
  Download,
  X,
  Radio,
  Activity,
  Video,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Building,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileCheck
} from 'lucide-react';

interface SubscriptionContractPrintModalProps {
  subscription: SubscriptionContract | null;
  onClose: () => void;
}

export const SubscriptionContractPrintModal: React.FC<SubscriptionContractPrintModalProps> = ({
  subscription,
  onClose,
}) => {
  const { settings, showNotification } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!subscription) return null;

  const rate = settings.exchangeRateUSD_CDF || 2850;
  const isVatSubject = settings.dgiIsVatSubject !== false;
  const vatRate = isVatSubject ? 16 : 0;
  const basePriceUSD = subscription.priceUSD;
  const vatAmountUSD = isVatSubject ? basePriceUSD * 0.16 : 0;
  const totalTtcUSD = basePriceUSD + vatAmountUSD;
  const totalTtcCDF = totalTtcUSD * rate;

  const handlePrint = async () => {
    if (!printAreaRef.current) return;
    setIsPrinting(true);
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolder = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const cleanClient = subscription.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanFolder}_CONTRAT_${subscription.contractNumber}_${cleanClient}.pdf`;

    try {
      // 1. Direct PDF download targeted at C:\hibtech
      await downloadElementAsPDF(printAreaRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
        scale: 3,
      });

      // 2. Direct print to default printer
      await printDirectToDefaultPrinter(printAreaRef.current, {
        format: 'A4',
        title: `Contrat_Abonnement_${subscription.contractNumber}`,
      });

      showNotification(`✓ Contrat imprimé et PDF sauvegardé pour ${targetFolder}`, 'success');
    } catch (err) {
      console.error('Erreur impression contrat:', err);
      showNotification('Impression envoyée', 'info');
    } finally {
      setIsPrinting(false);
      onClose();
    }
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPDF(true);
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolder = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const cleanClient = subscription.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanFolder}_CONTRAT_${subscription.contractNumber}_${cleanClient}.pdf`;

    try {
      await downloadElementAsPDF(printAreaRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
        scale: 3,
      });
      showNotification(`✓ PDF téléchargé pour ${targetFolder}`, 'success');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'STARLINK_SERVICE':
        return 'Abonnement Internet Satellite Starlink';
      case 'IT_MAINTENANCE':
        return 'Contrat de Maintenance Informatique & Réseau';
      case 'CCTV_SURVEILLANCE_MAINTENANCE':
        return 'Contrat de Maintenance Vidéosurveillance IP & Sécurité';
      case 'NETWORK_SLA':
        return 'Accord de Niveau de Service Réseau (SLA Enterprise)';
      default:
        return 'Abonnement Professionnel';
    }
  };

  const getCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'MONTHLY':
        return 'Mensuel (Paiement chaque mois)';
      case 'QUARTERLY':
        return 'Trimestriel (Paiement tous les 3 mois)';
      case 'SEMI_ANNUAL':
        return 'Semestriel (Paiement tous les 6 mois)';
      case 'ANNUAL':
        return 'Annuel (Paiement par an)';
      default:
        return cycle;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[96vh]">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 px-6 py-3 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm">
              Contrat d'Abonnement & SLA :{' '}
              <span className="font-mono text-cyan-300">{subscription.contractNumber}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Télécharger PDF (C:\hibtech)</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span>Imprimer & Fermer</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Viewport */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-neutral-100 flex-1 flex justify-center">
          <div
            ref={printAreaRef}
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 p-8 sm:p-10 shadow-lg border border-neutral-300 font-sans text-xs leading-relaxed flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header: Company & Official Fiscal Identity */}
            <div>
              <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                    {settings.name || 'CONGO TECH & PRESTATIONS SARL'}
                  </h1>
                  <p className="text-[11px] text-neutral-600 font-medium">
                    {settings.slogan || 'Vente de Matériels & Prestations de Services Professionnels en RDC'}
                  </p>
                  <p className="text-[10px] text-neutral-500 max-w-md">
                    {settings.address} • {settings.city}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    Tél : {settings.phone1} {settings.phone2 ? `| ${settings.phone2}` : ''} • Email : {settings.email}
                  </p>
                </div>

                <div className="text-right text-[10px] bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg">
                  <div className="font-bold text-neutral-800 uppercase tracking-wide">Identifiants Légaux RDC</div>
                  <div className="mt-1 font-mono text-neutral-700">
                    <div>RCCM : <span className="font-semibold">{settings.rccm || 'CD/KIN/RCCM/21-B-04812'}</span></div>
                    <div>ID. NAT : <span className="font-semibold">{settings.idNat || '01-83-N49102X'}</span></div>
                    <div>NIF : <span className="font-semibold">{settings.nif || 'A2109845B'}</span></div>
                    <div className="text-emerald-700 font-semibold mt-0.5">{settings.dgiCenter || 'Centre des Impôts'}</div>
                  </div>
                </div>
              </div>

              {/* Document Banner */}
              <div className="my-5 bg-gradient-to-r from-neutral-900 to-slate-800 text-white p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    {getTypeName(subscription.type)}
                  </div>
                  <div className="text-base font-black tracking-tight mt-0.5">
                    CONTRAT D'ABONNEMENT RÉCURRENT & SLA
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400 font-mono">N° CONTRAT</div>
                  <div className="text-sm font-black font-mono text-cyan-300">{subscription.contractNumber}</div>
                </div>
              </div>

              {/* Client & Contract Term Grid */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Client Box */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-neutral-600" />
                    Souscripteur / Client Bénéficiaire
                  </div>
                  <div className="text-sm font-bold text-neutral-900">{subscription.clientName}</div>
                  <div className="text-[11px] text-neutral-600 mt-1 space-y-0.5">
                    {subscription.clientPhone && <div>Tél : <span className="font-medium text-neutral-800">{subscription.clientPhone}</span></div>}
                    {subscription.clientEmail && <div>Email : <span className="font-medium text-neutral-800">{subscription.clientEmail}</span></div>}
                  </div>
                </div>

                {/* Contract Validity Box */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                    Période d'Effet & Échéances
                  </div>
                  <div className="text-[11px] text-neutral-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Date d'effet / Début :</span>
                      <span className="font-bold text-neutral-900">{formatDate(subscription.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Prochaine Échéance :</span>
                      <span className="font-bold text-cyan-700">{formatDate(subscription.nextBillingDate)}</span>
                    </div>
                    {subscription.expirationDate && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Terme du contrat :</span>
                        <span className="font-medium text-neutral-800">{formatDate(subscription.expirationDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-neutral-200">
                      <span className="text-neutral-500">Renouvellement :</span>
                      <span className="font-semibold text-emerald-700">
                        {subscription.autoRenew ? 'Reconduction Tacite Mensuelle' : 'Renouvellement Exprès'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications & SLA Scope */}
              <div className="border border-neutral-200 rounded-xl p-4 mb-5 bg-white shadow-2xs">
                <div className="text-[11px] font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-600" />
                  Spécifications du Forfait & Engagements Techniques (SLA)
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase block font-medium">Désignation du Plan</span>
                    <span className="font-bold text-neutral-900 text-xs">
                      {subscription.planName || subscription.title}
                    </span>
                  </div>

                  {subscription.accountIdentifier && (
                    <div>
                      <span className="text-neutral-500 text-[10px] uppercase block font-medium">Identifiant Compte / Kit Starlink</span>
                      <span className="font-mono font-bold text-neutral-800 text-xs">
                        {subscription.accountIdentifier}
                      </span>
                    </div>
                  )}

                  {subscription.equipmentSerialNumber && (
                    <div>
                      <span className="text-neutral-500 text-[10px] uppercase block font-medium">N° de Série Matériel Associé</span>
                      <span className="font-mono font-bold text-neutral-800 text-xs">
                        {subscription.equipmentSerialNumber}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase block font-medium">Périodicité de Facturation</span>
                    <span className="font-semibold text-neutral-800 text-xs">
                      {getCycleLabel(subscription.billingCycle)}
                    </span>
                  </div>
                </div>

                {subscription.coverageDetails && (
                  <div className="mt-3.5 pt-3 border-t border-neutral-100">
                    <span className="text-neutral-500 text-[10px] uppercase block font-semibold mb-1">
                      Périmètre de Couverture & Engagements Fournisseur :
                    </span>
                    <p className="text-neutral-700 text-[11px] bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 leading-normal">
                      {subscription.coverageDetails}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Conditions & DGI RDC VAT Breakdown */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden mb-5">
                <div className="bg-neutral-800 text-white px-4 py-2 font-bold text-xs uppercase tracking-wider flex justify-between items-center">
                  <span>Conditions Tarifaires & Fiscales (DGI RDC - Loi N° 10/010)</span>
                  <span className="text-[10px] text-cyan-300 font-mono">Taux : 1 USD = {rate.toLocaleString('fr-FR')} CDF</span>
                </div>

                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                    <tr>
                      <th className="text-left px-4 py-2">Prestation / Redevance</th>
                      <th className="text-center px-4 py-2">Groupe Fiscal</th>
                      <th className="text-right px-4 py-2">Montant HT</th>
                      <th className="text-right px-4 py-2">TVA (16%)</th>
                      <th className="text-right px-4 py-2">Montant Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <tr>
                      <td className="px-4 py-3">
                        <div className="font-bold text-neutral-900">{subscription.title}</div>
                        <div className="text-[10px] text-neutral-500">Facturation {getCycleLabel(subscription.billingCycle)}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Groupe A (16%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-800">
                        ${basePriceUSD.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-600">
                        ${vatAmountUSD.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-900">
                        ${totalTtcUSD.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-2.5 text-[11px] text-neutral-500 italic">
                        Montant équivalent en Francs Congolais (CDF) suivant cours commercial officiel :
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-neutral-800 uppercase text-[11px]">
                        Total Échéance :
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="text-sm font-black text-cyan-800">${totalTtcUSD.toFixed(2)}</div>
                        <div className="text-[10px] font-bold text-neutral-600">
                          ≈ {Math.round(totalTtcCDF).toLocaleString('fr-FR')} CDF
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Settlement Instructions & Payment Channels */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-5 text-[10px] space-y-1 text-neutral-600">
                <div className="font-bold text-neutral-800 uppercase">Modalités de Paiement & Coordonnées Bancaires :</div>
                <div>• <span className="font-semibold text-neutral-800">Virement Bancaire :</span> {settings.bankDetails || 'RAWBANK USD : 0100-2938491029-45 | EQUITY BCDC CDF : 0520-4820194829-12'}</div>
                <div>• <span className="font-semibold text-neutral-800">Mobile Money :</span> M-Pesa : {settings.mpesaNumber} ({settings.mpesaName}) | Orange Money : {settings.orangeMoneyNumber} | Airtel Money : {settings.airtelMoneyNumber}</div>
                <div className="text-neutral-500 pt-1">
                  * Les factures officielles DGI sont émises à chaque échéance et transmises par email et WhatsApp. Le service peut être suspendu automatiquement après 7 jours de retard de paiement.
                </div>
              </div>
            </div>

            {/* Bottom Signatures & Legal Stamps */}
            <div className="pt-4 border-t-2 border-neutral-800">
              <div className="grid grid-cols-2 gap-8 text-neutral-800">
                {/* Client Side */}
                <div className="border border-neutral-300 rounded-xl p-4 flex flex-col justify-between min-h-[120px] bg-neutral-50/50">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-neutral-900">Pour le Client / Souscripteur</div>
                    <div className="text-[10px] text-neutral-500">Mention manuscrite « Lu et approuvé, bon pour accord » :</div>
                  </div>
                  <div className="border-b border-dashed border-neutral-400 my-4" />
                  <div className="text-[10px] text-neutral-600 flex justify-between">
                    <span>Nom & Signature :</span>
                    <span>Date : _____ / _____ / 2026</span>
                  </div>
                </div>

                {/* Provider Side */}
                <div className="border border-neutral-300 rounded-xl p-4 flex flex-col justify-between min-h-[120px] bg-neutral-50/50 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-neutral-900">Pour Congo Tech SARL</div>
                      <div className="text-[10px] text-neutral-500">Direction Générale & Service Réseau</div>
                    </div>
                    {/* Stamp Preview */}
                    {settings.stampUrl && (
                      <div className="w-16 h-16 opacity-90 -mt-2 -mr-1">
                        <img src={settings.stampUrl} alt="Cachet Congo Tech" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {settings.signatureUrl ? (
                    <div className="my-1 h-10 flex items-center">
                      <img src={settings.signatureUrl} alt="Signature" className="h-full object-contain" />
                    </div>
                  ) : (
                    <div className="border-b border-dashed border-neutral-400 my-4" />
                  )}

                  <div className="text-[10px] text-neutral-600 flex justify-between">
                    <span>Fait le {formatDate(subscription.startDate)}</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Certifié Conforme
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
