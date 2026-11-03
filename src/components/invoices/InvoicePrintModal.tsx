import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, getPaymentMethodLabel, getStatusBadge } from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { printDirectToDefaultPrinter } from '../../utils/printDirect';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  X,
  FileText,
  Receipt,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Download,
  Loader2,
  Stamp,
  PenTool,
  Image as ImageIcon,
  Check,
  Gauge,
  AlertCircle,
  Building,
  CreditCard,
  Zap,
} from 'lucide-react';
import { InvoiceDocumentA4 } from './InvoiceDocumentA4';

export const InvoicePrintModal: React.FC = () => {
  const { activePrintSale, setActivePrintSale, settings, setActiveWhatsAppClient, clients, showNotification } = useApp();
  
  // Format initialized based on document type (RECEIPT = THERMAL 80mm, INVOICE/PROFORMA = A4)
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL'>(() => {
    return activePrintSale?.type === 'RECEIPT' ? 'THERMAL' : 'A4';
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Auto-switch format when a new sale is set to print
  useEffect(() => {
    if (activePrintSale?.type === 'RECEIPT') {
      setPrintFormat('THERMAL');
    } else if (activePrintSale) {
      setPrintFormat('A4');
    }
  }, [activePrintSale?.id, activePrintSale?.type]);

  // Document visa, gauge & branding options
  const [includeSignature, setIncludeSignature] = useState<boolean>(settings.includeSignatureOnInvoicesByDefault !== false);
  const [includeStamp, setIncludeStamp] = useState<boolean>(settings.includeStampOnInvoicesByDefault !== false);
  const [includeCashPaidStamp, setIncludeCashPaidStamp] = useState<boolean>(() => {
    if (!activePrintSale || activePrintSale.type === 'QUOTE_PROFORMA') return false;
    const isCash = activePrintSale.paymentMethod === 'CASH_USD' || activePrintSale.paymentMethod === 'CASH_CDF';
    return Boolean(
      settings.includeCashPaidStampByDefault !== false &&
      (isCash || activePrintSale.amountPaidUSD > 0)
    );
  });
  const [includeLogo, setIncludeLogo] = useState<boolean>(settings.showLogoOnInvoices !== false);
  const [includeGauge, setIncludeGauge] = useState<boolean>(() => activePrintSale?.type !== 'QUOTE_PROFORMA');
  const [showPdfOptionsDialog, setShowPdfOptionsDialog] = useState<boolean>(false);

  useEffect(() => {
    if (activePrintSale) {
      if (activePrintSale.type === 'QUOTE_PROFORMA') {
        setIncludeCashPaidStamp(false);
        setIncludeGauge(false);
      } else {
        const isCash = activePrintSale.paymentMethod === 'CASH_USD' || activePrintSale.paymentMethod === 'CASH_CDF';
        const isCashOrPaid = isCash || (activePrintSale.amountPaidUSD > 0 && activePrintSale.remainingDebtUSD === 0);
        setIncludeCashPaidStamp(Boolean(settings.includeCashPaidStampByDefault !== false && isCashOrPaid));
        setIncludeGauge(true);
      }
    }
  }, [activePrintSale?.id, activePrintSale?.type, activePrintSale?.paymentMethod, settings.includeCashPaidStampByDefault]);

  // Directly send document to default printer, download PDF immediately to C/hibtech, and automatically close window
  const handlePrint = async () => {
    if (!printContainerRef.current || !activePrintSale) return;
    setIsPrinting(true);
    const sale = activePrintSale;
    const cleanClient = (sale.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    const docType = sale.type === 'QUOTE_PROFORMA' ? 'Devis' : sale.type === 'RECEIPT' ? 'Ticket' : 'Facture';
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolderName = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const filename = `${cleanFolderName}_${docType}_${sale.saleNumber}_${cleanClient}.pdf`;

    try {
      // 1. Téléchargement immédiat du PDF haute définition (< 3 Mo garanti)
      const pdfRes = await downloadElementAsPDF(printContainerRef.current, filename, {
        format: printFormat === 'A4' ? 'a4' : [80, 297],
        orientation: 'portrait',
        margin: printFormat === 'A4' ? 6 : 2,
        fitToSinglePage: printFormat === 'A4',
        scale: 2.0,
        maxSizeBytes: 3 * 1024 * 1024,
      });

      // 2. Envoi direct à l'imprimante par défaut de l'ordinateur
      await printDirectToDefaultPrinter(printContainerRef.current, {
        format: printFormat,
        title: `${docType}_${sale.saleNumber}`,
      });

      const sizeInfo = pdfRes && typeof pdfRes === 'object' && pdfRes.formattedSize ? ` (${pdfRes.formattedSize})` : ' (< 3 Mo)';
      showNotification(`✓ Document envoyé à l'imprimante et PDF sauvegardé${sizeInfo} pour ${targetFolder}`, 'success');
    } catch (err) {
      console.error('Erreur impression/PDF:', err);
      showNotification(`Impression transmise pour ${targetFolder}`, 'info');
    } finally {
      setIsPrinting(false);
      // 3. Fermeture automatique immédiate de la fenêtre
      setActivePrintSale(null);
    }
  };

  // Keyboard shortcut: Press Enter or Ctrl+P to trigger direct print immediately
  useEffect(() => {
    if (!activePrintSale) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input/textarea inside the modal, do not intercept
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActivePrintSale(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePrintSale, printFormat, includeSignature, includeStamp, includeGauge]);

  if (!activePrintSale) return null;

  const sale = activePrintSale;
  const client = clients.find(c => c.id === sale.clientId) || {
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

  const executeDownloadPDF = async () => {
    setShowPdfOptionsDialog(false);
    if (!printContainerRef.current) return;
    setIsGeneratingPDF(true);
    // Give React time to commit DOM changes
    await new Promise((r) => setTimeout(r, 60));
    try {
      const cleanClient = (sale.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
      const docType = sale.type === 'QUOTE_PROFORMA' ? 'Devis' : sale.type === 'RECEIPT' ? 'Ticket' : 'Facture';
      const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
      const cleanFolderName = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
      const filename = `${cleanFolderName}_${docType}_${sale.saleNumber}_${cleanClient}.pdf`;
      const pdfRes = await downloadElementAsPDF(printContainerRef.current, filename, {
        format: printFormat === 'A4' ? 'a4' : [80, 297],
        orientation: 'portrait',
        margin: printFormat === 'A4' ? 6 : 2,
        fitToSinglePage: printFormat === 'A4',
        scale: 2.0,
        maxSizeBytes: 3 * 1024 * 1024,
      });
      const sizeInfo = pdfRes && typeof pdfRes === 'object' && pdfRes.formattedSize ? ` (${pdfRes.formattedSize} · < 3 Mo)` : ' (< 3 Mo)';
      showNotification(`✓ PDF téléchargé${sizeInfo} pour ${targetFolder}`, 'success');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = () => {
    if (printFormat === 'A4') {
      setShowPdfOptionsDialog(true);
    } else {
      executeDownloadPDF();
    }
  };

  const isQuote = sale.type === 'QUOTE_PROFORMA';
  const isReceipt = sale.type === 'RECEIPT';
  const paymentInfo = getPaymentMethodLabel(sale.paymentMethod);
  const statusBadge = getStatusBadge(sale.paymentStatus);
  const rate = sale.exchangeRate || settings.exchangeRateUSD_CDF || 2850;

  // Dynamic density calculation to fit multi-item invoices seamlessly
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
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="print-modal-card bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[96vh]">
        {/* Top bar (Hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-neutral-200 bg-neutral-900 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">
                {isQuote ? 'Devis Proforma' : 'Facture'} : <span className="font-mono-nums text-amber-400">{sale.saleNumber}</span>
              </span>
            </div>
            {/* Design & 1-Page Guarantee & < 3 Mo Badge */}
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-blue-900/60 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded font-medium">
              {isQuote ? `📋 Devis Proforma · 1 Page Garantie · < 3 Mo (${itemCount} article${itemCount > 1 ? 's' : ''})` : `✨ Facture A4 · < 3 Mo Certifié · Jauge Active (${itemCount} art.)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Quick toggles for Visa & Gauge */}
            {printFormat === 'A4' && (
              <div className="hidden xl:flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg border border-neutral-700 text-xs">
                {/* Jauge Toggle (uniquement factures) */}
                {!isQuote && (
                  <button
                    type="button"
                    onClick={() => setIncludeGauge(!includeGauge)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      includeGauge ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Afficher ou masquer la jauge de règlement et solvabilité"
                  >
                    <Gauge className="w-3 h-3" />
                    <span>Jauge: {includeGauge ? 'OUI' : 'NON'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIncludeSignature(!includeSignature)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    includeSignature ? 'bg-indigo-900/90 text-indigo-200 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Activer ou désactiver la signature sur le visa officiel"
                >
                  <PenTool className="w-3 h-3" />
                  <span>Signature: {includeSignature ? 'OUI' : 'NON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeStamp(!includeStamp)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                    includeStamp ? 'bg-emerald-900/90 text-emerald-200 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Activer ou désactiver le sceau officiel"
                >
                  <Stamp className="w-3 h-3" />
                  <span>Sceau: {includeStamp ? 'OUI' : 'NON'}</span>
                </button>

                {/* Cachet Payé Cash (uniquement factures) */}
                {!isQuote && (
                  <button
                    type="button"
                    onClick={() => setIncludeCashPaidStamp(!includeCashPaidStamp)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      includeCashPaidStamp ? 'bg-rose-900/90 text-rose-200 font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Apposer ou retirer le cachet PAYÉ CASH"
                  >
                    <Stamp className="w-3 h-3 text-rose-400" />
                    <span>Payé Cash: {includeCashPaidStamp ? 'OUI' : 'NON'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Format selector */}
            <div className="flex items-center bg-neutral-800 p-0.5 rounded-lg border border-neutral-700 text-xs">
              <button
                onClick={() => setPrintFormat('A4')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 sm:gap-1.5 ${
                  printFormat === 'A4' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-neutral-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Format </span>A4
              </button>
              <button
                onClick={() => setPrintFormat('THERMAL')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 sm:gap-1.5 ${
                  printFormat === 'THERMAL' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket</span>
              </button>
            </div>

            <button
              onClick={() => {
                setActiveWhatsAppClient({ client, sale });
              }}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 shadow-xs"
              title="Envoyer le document PDF via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 font-bold shadow-xs"
              title="Télécharger le document au format PDF haute résolution"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-blue-200" />
              )}
              <span>{isGeneratingPDF ? 'PDF...' : 'PDF'}</span>
            </button>

            {/* Direct Print to Default Printer Button & Auto-Download to C:\hibtech */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3 sm:px-4 py-1.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-50 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title={`Envoyer directement à l'imprimante par défaut, sauvegarder le PDF dans ${settings.pdfExportPath || 'C:\\hibtech'} et fermer immédiatement (Raccourci : Entrée ou Ctrl+P)`}
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-neutral-900" />
              ) : (
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-900" />
              )}
              <span>{isPrinting ? 'Impression & PDF...' : 'Imprimer'}</span>
              <span className="hidden lg:inline-flex items-center text-[10px] bg-amber-500/90 text-neutral-950 px-1 py-0.2 rounded font-mono font-bold tracking-tight">
                PDF C:\hibtech
              </span>
              <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] bg-amber-500/80 text-neutral-950 rounded font-mono font-bold">
                Entrée
              </kbd>
            </button>

            <button
              onClick={() => setActivePrintSale(null)}
              className="text-neutral-400 hover:text-white p-1 sm:p-1.5 rounded-lg transition-colors ml-1 sm:ml-2"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hibtech Direct Print & Auto-Save Notification Bar */}
        <div className="no-print bg-amber-50 border-b border-amber-200 px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs">
              <strong className="font-bold text-amber-950">Mode Impression Rapide :</strong> Clic sur <strong className="font-bold text-neutral-900 underline">Imprimer</strong> envoie le document à l'imprimante, télécharge le PDF dans <span className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">{settings.pdfExportPath || 'C:\\hibtech'}</span> et ferme cette fenêtre automatiquement.
            </span>
          </div>
          <span className="hidden md:inline-block text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">
            Raccourci : Touche Entrée
          </span>
        </div>

        {/* Print Preview Container */}
        <div className="print-preview-container p-4 sm:p-8 overflow-auto bg-neutral-200/70 flex justify-center flex-1">
          {printFormat === 'A4' ? (
            /* ================= FORMAT A4 FACTURE (BLEU & BLANC + JAUGE) ================= */
            <InvoiceDocumentA4
              sale={sale}
              client={client}
              settings={settings}
              rate={rate}
              includeGauge={includeGauge}
              includeSignature={includeSignature}
              includeStamp={includeStamp}
              includeCashPaidStamp={includeCashPaidStamp}
              includeLogo={includeLogo}
              containerRef={printContainerRef}
            />
          ) : (
            /* ================= FORMAT TICKET DE CAISSE THERMIQUE 80MM ================= */
            <div ref={printContainerRef} className="print-page bg-white w-80 p-5 shadow-md rounded-lg border border-neutral-300 font-mono text-[11px] leading-tight text-neutral-900">
              <div className="text-center pb-2.5 border-b border-dashed border-neutral-400">
                <p className="font-bold text-xs uppercase text-neutral-800">TICKET DE CAISSE</p>
                <p className="font-bold text-sm tracking-tight uppercase mt-1 text-blue-950">{settings.name}</p>
                <p className="text-[10px]">{settings.address}, {settings.city}</p>
                <p className="text-[10px]">Tél : {settings.phone1}</p>
                {settings.nif && <p className="text-[10px] font-bold">NIF : {settings.nif} | RCCM : {settings.rccm}</p>}
              </div>

              <div className="py-2 border-b border-dashed border-neutral-400 text-[10px]">
                <div className="flex justify-between">
                  <span>FAC: {sale.saleNumber}</span>
                  <span>{formatDate(sale.createdAt)}</span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="font-bold">NFU: {sale.dgiNfu || 'SFN-00000'}</span>
                  <span>#{sale.dgiFiscalCounter || 1001}</span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span>Client: {sale.clientName.substring(0, 16)}</span>
                  <span>NIF: {sale.clientNif ? sale.clientNif.substring(0, 10) : 'NON-ASSUJ.'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2 border-b border-dashed border-neutral-400 space-y-1.5">
                {sale.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-semibold">
                      <span className="truncate pr-1">[Gr.{item.taxGroup}] {item.name}</span>
                      <span>${item.subtotalUSD.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-neutral-600 flex justify-between">
                      <span>{item.quantity} {item.unit} x ${item.unitPriceUSD.toFixed(2)}</span>
                      <span>{item.taxGroup === 'A' ? 'TVA 16%' : 'Exonéré'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux & Jauge Ticket */}
              <div className="py-2 border-b border-dashed border-neutral-400 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>TOTAL HT :</span>
                  <span>${sale.subtotalUSD.toFixed(2)}</span>
                </div>
                {sale.taxAmountUSD > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>TVA RDC (16%) :</span>
                    <span>+${sale.taxAmountUSD.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-300">
                  <span>TOTAL TTC ($) :</span>
                  <span>${sale.totalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900">
                  <span>TOTAL TTC (CDF) :</span>
                  <span>{new Intl.NumberFormat('fr-FR').format(sale.totalCDF)} FC</span>
                </div>
                <div className="text-[10px] text-neutral-500">Taux BCC : 1$ = {rate} FC</div>

                {/* Ticket Settlement Badge */}
                <div className="pt-1 border-t border-neutral-200">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span>JAUGE PAIEMENT :</span>
                    <span className={isFullyPaid ? 'text-emerald-700 font-black' : 'text-amber-700 font-black'}>
                      {percentPaid}% {isFullyPaid ? '(SOLDÉ)' : '(ACOMPTE)'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-0.5 text-neutral-700">
                    <span>Payé ({paymentInfo.label}) :</span>
                    <span>${sale.amountPaidUSD.toFixed(2)}</span>
                  </div>
                  {sale.remainingDebtUSD > 0 && (
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>SOLDE RESTANT :</span>
                      <span>${sale.remainingDebtUSD.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Cachet PAYÉ CASH / COMPTANT sur Ticket */}
                  {includeCashPaidStamp && settings.cashPaidStampUrl && (
                    <div className="pt-2 pb-1 flex justify-center">
                      <img
                        src={settings.cashPaidStampUrl}
                        alt="Cachet Payé Cash"
                        className="w-56 h-24 object-contain drop-shadow-sm -rotate-3"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code & Digital Signature */}
              <div className="pt-2.5 pb-2 text-center flex flex-col items-center justify-center space-y-1 border-b border-dashed border-neutral-400">
                <QRCodeSVG
                  value={sale.dgiQrPayload || `DOC-RDC|${sale.saleNumber}|${sale.totalUSD}|${sale.dgiSecurityCode}`}
                  size={84}
                  level="M"
                />
                <span className="text-[9px] font-bold">CS: {sale.dgiSecurityCode}</span>
                <span className="text-[8px] text-emerald-700 font-bold">{sale.dgiReceiptNumber || 'REC-2026-0049281'}</span>
                <span className="text-[8px] text-neutral-500">CODE D'AUTHENTIFICATION DGI</span>
              </div>

              <div className="pt-2 text-center text-[9px] text-neutral-600 space-y-0.5">
                <p className="font-semibold">*** MERCI POUR VOTRE ACHAT ***</p>
                <p>Conservez ce ticket pour tout échange ou réclamation.</p>
              </div>
            </div>
          )}
        </div>

        {/* PDF Export & Visa Options Dialog Box */}
        {showPdfOptionsDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">Génération du Document PDF</h3>
                    <p className="text-[11px] text-neutral-500">Thème Bleu & Blanc avec Jauge & Sceau</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPdfOptionsDialog(false)}
                  className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Configurez les options de mise en page pour la facture de <strong className="text-neutral-900">{settings.name}</strong> :
              </p>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-snug">
                  <strong>Poids optimisé garanti :</strong> Le fichier généré est compressé pour ne pas dépasser <strong>3 Mo</strong> (idéal pour WhatsApp, e-mail et mobile).
                </span>
              </div>

              <div className="space-y-2.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-xs">
                {/* Option 0: Jauge */}
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-blue-400 transition-colors cursor-pointer shadow-2xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeGauge}
                      onChange={(e) => setIncludeGauge(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-blue-600" />
                        Afficher la Jauge de Règlement
                      </span>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        Indicateur visuel de solvabilité & acomptes
                      </span>
                    </div>
                  </div>
                </label>

                {/* Option 1: Signature */}
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-blue-400 transition-colors cursor-pointer shadow-2xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeSignature}
                      onChange={(e) => setIncludeSignature(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-blue-600" />
                        Apposer la Signature Autorisée
                      </span>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        {settings.signatureUrl ? 'Signature configurée active' : 'Signature type activée'}
                      </span>
                    </div>
                  </div>
                  {settings.signatureUrl && (
                    <img
                      src={settings.signatureUrl}
                      alt="Signature"
                      className="h-7 max-w-[64px] object-contain p-0.5 border border-neutral-200 rounded bg-white"
                    />
                  )}
                </label>

                {/* Option 2: Sceau / Cachet */}
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-emerald-400 transition-colors cursor-pointer shadow-2xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeStamp}
                      onChange={(e) => setIncludeStamp(e.target.checked)}
                      className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                        Apposer le Sceau / Cachet Officiel
                      </span>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        {settings.stampUrl ? 'Cachet officiel prêt' : 'Sceau standard actif'}
                      </span>
                    </div>
                  </div>
                  {settings.stampUrl && (
                    <img
                      src={settings.stampUrl}
                      alt="Sceau"
                      className="h-7 w-7 object-contain p-0.5 border border-neutral-200 rounded bg-white"
                    />
                  )}
                </label>

                {/* Option 3: Logo */}
                {settings.logoUrl && (
                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-neutral-200 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeLogo}
                        onChange={(e) => setIncludeLogo(e.target.checked)}
                        className="rounded border-neutral-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                          Afficher le Logo d'Entreprise
                        </span>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">
                          En-tête de la facture
                        </span>
                      </div>
                    </div>
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="h-7 max-w-[64px] object-contain p-0.5 border border-neutral-200 rounded bg-white"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPdfOptionsDialog(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={executeDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-blue-200" />
                  )}
                  <span>Télécharger le PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
