import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryNote } from '../../types';
import { formatDate } from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { printDirectToDefaultPrinter } from '../../utils/printDirect';
import { Printer, Download, X, Truck, ShieldCheck, CheckCircle2, Loader2, MapPin, Phone, Building } from 'lucide-react';

interface DeliveryNotePrintModalProps {
  note: DeliveryNote | null;
  onClose: () => void;
}

export const DeliveryNotePrintModal: React.FC<DeliveryNotePrintModalProps> = ({ note, onClose }) => {
  const { settings, showNotification } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!note) return null;

  const handlePrint = async () => {
    if (!printAreaRef.current) return;
    setIsPrinting(true);
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolder = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const cleanClient = note.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanFolder}_BL_${note.deliveryNumber}_${cleanClient}.pdf`;

    try {
      // 1. Auto download PDF
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
        title: `Bon_de_Livraison_${note.deliveryNumber}`,
      });

      showNotification(`✓ Bon de Livraison envoyé à l'imprimante et PDF sauvegardé pour ${targetFolder}`, 'success');
    } catch (err) {
      console.error('Erreur impression BL:', err);
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
    const cleanClient = note.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanFolder}_BL_${note.deliveryNumber}_${cleanClient}.pdf`;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[96vh]">
        {/* Top bar (Hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 px-6 py-3 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              Bon de Livraison & Décharge : <span className="font-mono text-amber-300">{note.deliveryNumber}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>PDF</span>
            </button>

            {/* Direct Print & Auto PDF & Auto-close */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-50 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Imprimer, télécharger le PDF dans C:\hibtech et fermer"
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900" /> : <Printer className="w-3.5 h-3.5 text-neutral-900" />}
              <span>{isPrinting ? 'Impression...' : 'Imprimer'}</span>
              <span className="hidden sm:inline text-[10px] bg-amber-500 text-neutral-950 px-1 py-0.2 rounded font-mono font-bold">
                PDF C:\hibtech
              </span>
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hibtech notice bar */}
        <div className="no-print bg-amber-50 border-b border-amber-200 px-6 py-1.5 flex items-center justify-between text-xs text-amber-950">
          <span className="text-[11px]">
            💡 En cliquant sur <strong>Imprimer</strong>, le Bon de Livraison est envoyé à l'imprimante, le PDF est téléchargé dans <code className="font-mono font-bold">{settings.pdfExportPath || 'C:\\hibtech'}</code> et cette fenêtre se referme automatiquement.
          </span>
        </div>

        {/* Print Content Container (A4) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-neutral-200/70 flex justify-center flex-1">
          <div
            ref={printAreaRef}
            className="print-page bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md rounded-lg text-neutral-900 font-sans flex flex-col justify-between"
          >
            {/* Upper Section */}
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center text-amber-400 font-black text-xl">
                      H
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-neutral-900 uppercase">
                        {settings.name}
                      </h1>
                      <p className="text-[11px] font-bold text-blue-900">
                        SERVICES & DÉPLOIEMENT RÉSEAUX · STARLINK · TÉLÉCOMS
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-600 pt-1 leading-tight">
                    <p>{settings.address}, {settings.city}, {settings.country}</p>
                    <p>Tél : {settings.phone1} {settings.phone2 ? `| ${settings.phone2}` : ''} · Email : {settings.email}</p>
                    {settings.rccm && <p className="font-mono">RCCM : {settings.rccm} · NIF : {settings.nif} · ID.NAT : {settings.idNat}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-amber-400 text-neutral-950 font-black text-sm uppercase rounded tracking-wider shadow-2xs">
                    BON DE LIVRAISON (BL)
                  </span>
                  <p className="text-lg font-mono font-black text-neutral-900 mt-2">
                    N° {note.deliveryNumber}
                  </p>
                  <p className="text-xs text-neutral-600">
                    Date : <span className="font-bold text-neutral-900">{formatDate(note.date)}</span>
                  </p>
                  {note.saleNumber && (
                    <p className="text-xs text-blue-800 font-bold mt-0.5">
                      Réf. Facture : {note.saleNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Client & Transport Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-1 text-xs">
                  <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                    DESTINATAIRE / CLIENT
                  </p>
                  <p className="text-sm font-bold text-neutral-950">{note.clientName}</p>
                  <p className="text-neutral-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{note.deliveryAddress}</span>
                  </p>
                  {note.siteName && (
                    <p className="text-neutral-700 font-medium">
                      Site : <strong className="text-neutral-900">{note.siteName}</strong>
                    </p>
                  )}
                  {note.clientPhone && (
                    <p className="text-neutral-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{note.clientPhone}</span>
                    </p>
                  )}
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-1 text-xs">
                  <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                    LOGISTIQUE & TRANSPORT
                  </p>
                  <p className="text-neutral-800">
                    Livreur : <strong className="text-neutral-950">{note.transporterName}</strong>
                  </p>
                  {note.transporterPhone && (
                    <p className="text-neutral-700">Contact : {note.transporterPhone}</p>
                  )}
                  {note.vehiclePlate && (
                    <p className="text-neutral-700">
                      Véhicule / Immat. : <span className="font-mono font-bold text-neutral-950">{note.vehiclePlate}</span>
                    </p>
                  )}
                  <p className="text-neutral-700">
                    Statut : <strong className="text-emerald-700">{note.status === 'DELIVERED' ? 'LIVRÉ ET RÉCEPTIONNÉ' : 'EN COURS'}</strong>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 text-white font-bold text-[11px] uppercase">
                      <th className="py-2.5 px-3 rounded-l">N°</th>
                      <th className="py-2.5 px-3">Désignation du Matériel & Équipement</th>
                      <th className="py-2.5 px-3">Numéro de Série (S/N) / Code</th>
                      <th className="py-2.5 px-3">État</th>
                      <th className="py-2.5 px-3 text-center">Qté</th>
                      <th className="py-2.5 px-3 rounded-r">Accessoires Inclus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {note.items.map((it, idx) => (
                      <tr key={it.id || idx} className="border-b border-neutral-200">
                        <td className="py-3 px-3 font-mono font-bold text-neutral-500">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-neutral-950">{it.name}</p>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-neutral-800">
                          {it.serialNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <span className="font-semibold text-emerald-800">
                            {it.condition === 'NEUF_SOUS_BLISTER' ? 'Neuf sous blister' : it.condition === 'TESTE_ET_FONCTIONNEL' ? 'Testé conforme' : 'Occasion'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-neutral-950">{it.quantity}</td>
                        <td className="py-3 px-3 text-[11px] text-neutral-600">
                          {it.accessories && it.accessories.length > 0 ? it.accessories.join(' · ') : 'Standards'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legal Discharge Clause */}
              <div className="p-4 bg-amber-50/90 rounded-xl border border-amber-300 text-xs space-y-1.5">
                <p className="font-black text-amber-950 uppercase text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  DÉCHARGE OFFICIELLE DE RÉCEPTION DE MATÉRIEL (RÉPUBLIQUE DÉMOCRATIQUE DU CONGO)
                </p>
                <p className="text-neutral-800 leading-relaxed text-[11px] italic">
                  « {note.dischargeNotes || 'Le client soussigné atteste avoir réceptionné ce jour le matériel et les accessoires listés ci-dessus en parfait état de fonctionnement, complets, sans vice apparent et conformes au bon de commande / facture. Toute réclamation ultérieure relative aux vices apparents ou manquants ne pourra être admise après signature de la présente décharge.'} »
                </p>
              </div>
            </div>

            {/* Bottom Signatures Section */}
            <div className="pt-8 mt-6 border-t border-neutral-300 grid grid-cols-2 gap-8 text-xs">
              {/* Transporter / Company */}
              <div className="border border-neutral-300 rounded-xl p-4 bg-neutral-50 text-center flex flex-col justify-between min-h-[140px]">
                <div>
                  <p className="font-black uppercase text-neutral-800 text-[11px]">
                    POUR LA SOCIÉTÉ EXPÉDITRICE
                  </p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase">{settings.name}</p>
                </div>
                {settings.stampUrl && (
                  <div className="my-2 flex justify-center">
                    <img src={settings.stampUrl} alt="Sceau officiel" className="h-16 object-contain" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-neutral-500">Livreur : {note.transporterName}</p>
                  <p className="font-bold text-neutral-900 mt-1">Visa & Cachet Expéditeur</p>
                </div>
              </div>

              {/* Client Receiver */}
              <div className="border border-neutral-300 rounded-xl p-4 bg-neutral-50 text-center flex flex-col justify-between min-h-[140px]">
                <div>
                  <p className="font-black uppercase text-neutral-800 text-[11px]">
                    POUR LE CLIENT RÉCEPTIONNAIRE
                  </p>
                  <p className="text-[10px] text-neutral-500">Mention manuscrite « Reçu Conforme »</p>
                </div>
                <div className="my-3 flex flex-col items-center justify-center">
                  {note.signedByClient ? (
                    <div className="text-emerald-700 font-serif italic text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Reçu et Déchargé conforme ({note.recipientName || 'Client'})</span>
                    </div>
                  ) : (
                    <div className="w-32 border-b border-dashed border-neutral-400 py-3 text-[10px] text-neutral-400">
                      Signature & Cachet Client
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-neutral-700">
                    Réceptionné par : <strong>{note.recipientName || 'Nom du signataire'}</strong> {note.recipientTitle ? `(${note.recipientTitle})` : ''}
                  </p>
                  <p className="text-[9px] text-neutral-500">Fait à Lubumbashi, le {formatDate(note.date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
