import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  generateWhatsAppDebtMessage,
  generateWhatsAppReceiptMessage,
  generateDirectWhatsAppInvoiceMessage,
  cleanPhoneNumber,
  formatDualCurrency,
} from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { InvoiceDocumentA4 } from '../invoices/InvoiceDocumentA4';
import { Sale } from '../../types';
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  X,
  Send,
  Download,
  Loader2,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Share2,
} from 'lucide-react';

export const WhatsAppReminderModal: React.FC = () => {
  const { activeWhatsAppClient, setActiveWhatsAppClient, settings, sales } = useApp();
  const [templateType, setTemplateType] = useState<'DIRECT' | 'RECEIPT' | 'DEBT'>('DIRECT');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState<boolean>(false);

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeWhatsAppClient) return;
    const { client, sale } = activeWhatsAppClient;
    const clientSales = sales.filter((s) => s.clientId === client.id);
    const unpaidSale = clientSales.find((s) => s.paymentStatus !== 'PAID');
    const resolvedSale = sale || unpaidSale || clientSales[0];
    const rate = settings.exchangeRateUSD_CDF || 2850;

    if (resolvedSale) {
      if (templateType === 'DIRECT') {
        setCustomMessage(generateDirectWhatsAppInvoiceMessage(resolvedSale, settings, rate));
      } else if (templateType === 'RECEIPT') {
        setCustomMessage(generateWhatsAppReceiptMessage(resolvedSale, settings));
      } else {
        setCustomMessage(generateWhatsAppDebtMessage(client, resolvedSale, settings, rate));
      }
    } else {
      setCustomMessage(generateWhatsAppDebtMessage(client, null, settings, rate));
    }
  }, [activeWhatsAppClient, templateType, settings, sales]);

  if (!activeWhatsAppClient) return null;

  const { client, sale } = activeWhatsAppClient;

  // Resolve target sale for PDF generation (either direct sale or most relevant client sale)
  const clientSales = sales.filter((s) => s.clientId === client.id);
  const unpaidSale = clientSales.find((s) => s.paymentStatus !== 'PAID');
  const targetSale: Sale = sale || unpaidSale || clientSales[0] || {
    id: `synth-${Date.now()}`,
    saleNumber: `FAC-${new Date().getFullYear()}-0001`,
    type: 'INVOICE',
    clientId: client.id,
    clientName: client.name,
    clientPhone: client.phone,
    clientAddress: client.address,
    items: [
      {
        itemId: 'serv-01',
        name: 'Solde & Prestations commerciales en compte',
        code: 'SRV-SOLDE',
        type: 'SERVICE',
        unit: 'Prestation',
        quantity: 1,
        unitPriceUSD: client.outstandingDebtUSD || 100,
        unitCostPriceUSD: 0,
        subtotalUSD: client.outstandingDebtUSD || 100,
        taxGroup: 'A',
        taxRate: 16,
        taxAmountUSD: (client.outstandingDebtUSD || 100) * 0.16,
      },
    ],
    subtotalUSD: client.outstandingDebtUSD || 100,
    discountUSD: 0,
    taxPercent: 16,
    taxAmountUSD: (client.outstandingDebtUSD || 100) * 0.16,
    totalUSD: (client.outstandingDebtUSD || 100) * 1.16,
    exchangeRate: settings.exchangeRateUSD_CDF || 2850,
    totalCDF: Math.round(((client.outstandingDebtUSD || 100) * 1.16) * (settings.exchangeRateUSD_CDF || 2850)),
    amountPaidUSD: 0,
    remainingDebtUSD: (client.outstandingDebtUSD || 100) * 1.16,
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH_USD',
    cashierName: 'Direction Commerciale',
    createdAt: new Date().toISOString(),
    paymentHistory: [],
    isNormalizedDGI: true,
    dgiNfu: 'SFN-00000000',
    dgiSecurityCode: '0000-0000-0000-0000',
    dgiFiscalCounter: 1001,
    dgiTerminalId: settings.dgiDefTerminalId || 'DEF-01',
    dgiQrPayload: `DGI-RDC|CLI:${client.name}`,
    dgiVatBreakdown: {
      groupA: { baseUSD: client.outstandingDebtUSD || 100, rate: 16, vatUSD: (client.outstandingDebtUSD || 100) * 0.16, totalTTC_USD: (client.outstandingDebtUSD || 100) * 1.16 },
      groupB: { baseUSD: 0, rate: 0, vatUSD: 0, totalTTC_USD: 0 },
      groupC: { baseUSD: 0, rate: 0, vatUSD: 0, totalTTC_USD: 0 },
      groupD: { baseUSD: 0, rate: 0, vatUSD: 0, totalTTC_USD: 0 },
      totalHT_USD: client.outstandingDebtUSD || 100,
      totalTVA_USD: (client.outstandingDebtUSD || 100) * 0.16,
      totalTTC_USD: (client.outstandingDebtUSD || 100) * 1.16,
      totalHT_CDF: (client.outstandingDebtUSD || 100) * (settings.exchangeRateUSD_CDF || 2850),
      totalTVA_CDF: (client.outstandingDebtUSD || 100) * 0.16 * (settings.exchangeRateUSD_CDF || 2850),
      totalTTC_CDF: ((client.outstandingDebtUSD || 100) * 1.16) * (settings.exchangeRateUSD_CDF || 2850),
    },
    dgiTransmissionStatus: 'TRANSMITTED',
  };

  const filename = `${
    targetSale.type === 'QUOTE_PROFORMA' ? 'Devis' : targetSale.type === 'RECEIPT' ? 'Recu' : 'Facture'
  }_${targetSale.saleNumber}_${client.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const phoneNumber = cleanPhoneNumber(client.whatsapp || client.phone || '');
  const rate = settings.exchangeRateUSD_CDF || 2850;
  const debtAmountUSD = targetSale ? targetSale.remainingDebtUSD : client.outstandingDebtUSD;
  const dualDebt = formatDualCurrency(debtAmountUSD, rate);

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(customMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(customMessage)}`;

  // Download PDF file only
  const handleDownloadPDFOnly = async () => {
    if (!pdfContainerRef.current) return;
    setIsGeneratingPDF(true);
    await new Promise((r) => setTimeout(r, 60));
    try {
      await downloadElementAsPDF(pdfContainerRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
        scale: 3, // 300 DPI sharpness
      });
      setPdfDownloaded(true);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Main action: Generate & Download PDF file + Open WhatsApp conversation with companion text
  const handleGenerateAndOpenWhatsApp = async () => {
    if (!pdfContainerRef.current) {
      window.open(whatsappUrl, '_blank');
      return;
    }

    setIsGeneratingPDF(true);
    await new Promise((r) => setTimeout(r, 60));
    try {
      await downloadElementAsPDF(pdfContainerRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
        scale: 3, // 300 DPI sharpness
      });
      setPdfDownloaded(true);

      // Open WhatsApp chat
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 400);
    } catch (e) {
      console.error('Error generating PDF:', e);
      window.open(whatsappUrl, '_blank');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-900 flex items-center justify-center font-bold shadow-xs">
              <MessageSquare className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Envoi de Facture / Document par WhatsApp
                </h3>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/30">
                  Format PDF
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Destinataire : <strong className="text-white">{client.name}</strong> {phoneNumber ? `(+${phoneNumber})` : '(Numéro non spécifié)'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveWhatsAppClient(null)}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Card: Document PDF Joint Haute Définition */}
          <div className="bg-gradient-to-br from-blue-50/90 via-white to-sky-50/80 border-2 border-blue-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0">
                  <FileText className="w-4 h-4 text-sky-300" />
                  <span className="text-[8px] font-mono leading-none mt-0.5">PDF</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-blue-950 text-xs sm:text-sm">
                      {targetSale.type === 'QUOTE_PROFORMA' ? 'Devis Proforma' : targetSale.type === 'RECEIPT' ? 'Reçu' : 'Facture Commerciale'} (PDF)
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                      Bleu & Blanc · Jauge
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-blue-800 font-semibold mt-0.5">
                    {filename}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDocumentPreview(!showDocumentPreview)}
                className="text-xs font-bold text-blue-700 hover:text-blue-950 px-2.5 py-1 bg-white hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 shrink-0"
              >
                {showDocumentPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showDocumentPreview ? 'Masquer aperçu' : 'Aperçu du PDF'}</span>
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="bg-white p-3 rounded-lg border border-blue-200/80 text-xs text-slate-700 space-y-1.5">
              <p className="leading-relaxed">
                📎 <strong className="text-blue-950">Transmission conforme en PDF :</strong> Le document à envoyer à votre client est édité sous forme de <strong>fichier PDF officiel à 300 DPI</strong> (Thème Bleu & Blanc, Jauge de règlement et QR Code DGI).
              </p>
              <p className="text-[11px] text-slate-500">
                1. Cliquez sur le bouton vert <strong>« Télécharger le PDF & Ouvrir WhatsApp »</strong>.
                <br />
                2. Le fichier PDF est automatiquement généré et enregistré sur votre appareil, et la discussion WhatsApp s'ouvre avec le message d'accompagnement.
                <br />
                3. Glissez simplement le fichier PDF dans la discussion (ou cliquez sur le trombone 📎 de WhatsApp pour le joindre).
              </p>
            </div>

            {/* Feedback badge if downloaded */}
            {pdfDownloaded && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-900 font-bold">Fichier PDF prêt !</strong>
                  <span>Le fichier <code>{filename}</code> est dans votre dossier Téléchargements. Glissez-le ou joignez-le dans WhatsApp.</span>
                </div>
              </div>
            )}

            {/* Collapsible Document Preview */}
            {showDocumentPreview && (
              <div className="border-2 border-blue-300 rounded-xl overflow-hidden bg-neutral-200 p-3 max-h-80 overflow-y-auto animate-in fade-in">
                <div className="text-center pb-2 text-xs font-bold text-blue-950 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Aperçu du Document PDF (Mise en page exacte imprimable)</span>
                </div>
                <div className="transform scale-[0.55] origin-top flex justify-center -mb-80">
                  <InvoiceDocumentA4
                    sale={targetSale}
                    client={client}
                    settings={settings}
                    rate={rate}
                    includeGauge={true}
                    includeSignature={true}
                    includeStamp={true}
                    includeLogo={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Template Switcher for Sale */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setTemplateType('DIRECT')}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
                templateType === 'DIRECT'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Message Facture PDF + M-Pesa
            </button>
            <button
              type="button"
              onClick={() => setTemplateType('RECEIPT')}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
                templateType === 'RECEIPT'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Reçu DGI Détaillé + PDF
            </button>
            {targetSale.remainingDebtUSD > 0 && (
              <button
                type="button"
                onClick={() => setTemplateType('DEBT')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-all ${
                  templateType === 'DEBT'
                    ? 'bg-white text-rose-800 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Relance Créance + PDF
              </button>
            )}
          </div>

          {/* Quick Info Bar */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px]">Total du Document</span>
              <span className="font-black text-sm text-neutral-900 font-mono-nums">
                ${targetSale.totalUSD.toFixed(2)} USD{' '}
                <span className="text-neutral-500 font-normal text-xs">
                  ({new Intl.NumberFormat('fr-FR').format(targetSale.totalCDF || Math.round(targetSale.totalUSD * rate))} FC)
                </span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block text-[11px]">Réf. Document</span>
              <span className="font-bold text-neutral-900 font-mono">{targetSale.saleNumber}</span>
            </div>
          </div>

          {/* Pre-written message textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Message d'accompagnement WhatsApp
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié !' : 'Copier le texte'}
              </button>
            </div>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full text-xs font-mono text-neutral-800 bg-neutral-50 border border-neutral-300 rounded-lg p-3 leading-relaxed focus:outline-none focus:border-emerald-600 focus:bg-white transition-all resize-y"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setActiveWhatsAppClient(null)}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 rounded-xl transition-colors order-3 sm:order-1 min-h-[42px] flex items-center justify-center"
          >
            Fermer
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            {/* Button: Télécharger le PDF seul */}
            <button
              type="button"
              onClick={handleDownloadPDFOnly}
              disabled={isGeneratingPDF}
              className="w-full sm:w-auto px-3.5 py-2.5 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs min-h-[42px]"
              title="Télécharger le fichier PDF sur votre appareil"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-blue-700" />
              )}
              <span>Télécharger PDF seul</span>
            </button>

            {/* Button: Télécharger le PDF & Ouvrir WhatsApp */}
            <button
              type="button"
              onClick={handleGenerateAndOpenWhatsApp}
              disabled={isGeneratingPDF}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs min-h-[42px]"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>PDF & Ouvrir WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Render Container for Offscreen PDF generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -9999, opacity: 0 }}>
        <InvoiceDocumentA4
          sale={targetSale}
          client={client}
          settings={settings}
          rate={rate}
          includeGauge={true}
          includeSignature={true}
          includeStamp={true}
          includeLogo={true}
          containerRef={pdfContainerRef}
        />
      </div>
    </div>
  );
};
