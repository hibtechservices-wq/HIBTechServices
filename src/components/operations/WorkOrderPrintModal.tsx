import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkOrder } from '../../types';
import { formatDate } from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { printDirectToDefaultPrinter } from '../../utils/printDirect';
import {
  Printer,
  Download,
  X,
  Wrench,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Building,
  Activity,
  Radio,
  Wifi,
  ShieldCheck
} from 'lucide-react';

interface WorkOrderPrintModalProps {
  order: WorkOrder | null;
  onClose: () => void;
}

export const WorkOrderPrintModal: React.FC<WorkOrderPrintModalProps> = ({ order, onClose }) => {
  const { settings, showNotification } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!order) return null;

  const handlePrint = async () => {
    if (!printAreaRef.current) return;
    setIsPrinting(true);
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolder = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const cleanClient = order.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanFolder}_FICHE_TECH_${order.orderNumber}_${cleanClient}.pdf`;

    try {
      // 1. Auto download PDF immediately
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
        title: `Fiche_Intervention_${order.orderNumber}`,
      });

      showNotification(
        `Fiche envoyée à l'imprimante par défaut & enregistrée dans ${targetFolder}`,
        'success'
      );

      // 3. Auto close window immediately
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Erreur lors du traitement d’impression:', err);
      showNotification("Erreur lors de l'impression directe", 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadOnly = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPDF(true);
    const targetFolder = settings.pdfExportPath || 'C:\\hibtech';
    const cleanFolder = targetFolder.replace(/[\/\\]+/g, '_').replace(/:/g, '');
    const cleanClient = order.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanFolder}_FICHE_TECH_${order.orderNumber}_${cleanClient}.pdf`;

    try {
      await downloadElementAsPDF(printAreaRef.current, filename, {
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        fitToSinglePage: true,
        scale: 3,
      });
      showNotification(`Document PDF téléchargé avec succès (${targetFolder})`, 'success');
    } catch (err) {
      console.error('Erreur téléchargement PDF:', err);
      showNotification('Erreur lors de la génération du PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getTypeLabel = (t: WorkOrder['type']) => {
    switch (t) {
      case 'INSTALLATION_STARLINK':
        return 'Installation & Déploiement Kit Starlink';
      case 'INSTALLATION_CCTV':
        return 'Installation Vidéosurveillance IP & NVR';
      case 'CABLING_NETWORK':
        return 'Câblage Structuré & Baie de Brassage';
      case 'ROUTER_WIFI_CONFIG':
        return 'Configuration Routeur, Borne WiFi & VLANs';
      case 'MAINTENANCE_PREVENTIVE':
        return 'Maintenance Préventive Contractuelle';
      case 'MAINTENANCE_CURATIVE_SAV':
        return 'Dépannage Curatif / Intervention SAV';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Fiche d'Intervention Technique #{order.orderNumber}
              </h3>
              <p className="text-xs text-slate-400">
                Impression directe imprimante par défaut & enregistrement immédiat dans <span className="font-mono text-cyan-400">{settings.pdfExportPath || 'C:\\hibtech'}</span>
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
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Impression en cours...
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer & Sauvegarder (Auto)
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

        {/* Printable Paper A4 Preview */}
        <div className="overflow-y-auto p-6 bg-slate-950 flex justify-center flex-1">
          <div
            ref={printAreaRef}
            className="w-full max-w-[794px] bg-white text-slate-900 p-8 shadow-2xl rounded-sm print:p-0 print:shadow-none print:w-full print:max-w-none text-xs"
            style={{ minHeight: '1120px' }}
          >
            {/* 1. Header Entreprise */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xl tracking-tighter">
                    HT
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                      {settings.name || 'HIBTECH SERVICES SARL'}
                    </h1>
                    <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                      {settings.activityDescription || 'Solutions Télécoms, Starlink & Vidéosurveillance Haut Débit'}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      RCCM: {settings.rccm || 'CD/KIN/RCCM/20-B-01142'} | Id. Nat: {settings.idNat || '01-83-N44921J'} | NIF: {settings.nif || 'A2019842M'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-900">{settings.address || 'Immeuble Sky, Blvd du 30 Juin'}</p>
                  <p>{settings.city ? `${settings.city} — ` : ''}Rép. Dém. du Congo</p>
                  <p>Tél: {settings.phone1 || '+243 82 000 1122'} / {settings.phone2 || '+243 99 888 7766'}</p>
                  <p>Email: {settings.email || 'support@hibtech.cd'}</p>
                </div>
              </div>

              {/* Title Banner */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center bg-slate-100 p-2.5 rounded">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Document Officiel de Terrain</span>
                  <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                    FICHE D'INTERVENTION TECHNIQUE & RAPPORT DE MISE EN SERVICE
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-blue-900 bg-white px-3 py-1 rounded border border-slate-300">
                    N° {order.orderNumber}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    Date: <span className="font-semibold">{formatDate(order.scheduledDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Client & Technicians Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
              {/* Client Box */}
              <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 uppercase tracking-wider text-[10px] text-blue-800 flex items-center gap-1.5">
                  <Building className="w-3 h-3 text-blue-700" /> Informations Client & Site
                </div>
                <p className="font-bold text-sm text-slate-900">{order.clientName}</p>
                {order.siteName && (
                  <p className="text-slate-700 font-medium mt-0.5">Site: {order.siteName}</p>
                )}
                <p className="text-slate-600 mt-0.5">{order.siteAddress}</p>
                <p className="text-slate-600 mt-0.5">Tél: <span className="font-medium text-slate-900">{order.clientPhone}</span></p>
              </div>

              {/* Mission Details Box */}
              <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
                <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 uppercase tracking-wider text-[10px] text-blue-800 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-blue-700" /> Équipe & Type de Mission
                </div>
                <p className="font-semibold text-slate-900">{getTypeLabel(order.type)}</p>
                <p className="text-slate-700 mt-0.5">
                  Technicien(s): <span className="font-semibold text-slate-900">{order.assignedTechnicians.join(', ')}</span>
                </p>
                <p className="text-slate-600 mt-0.5">
                  Priorité: <span className="font-semibold uppercase">{order.priority}</span> | Statut: <span className="font-semibold uppercase text-emerald-800">{order.status}</span>
                </p>
                {order.completedDate && (
                  <p className="text-emerald-700 font-semibold mt-0.5">
                    Clôturé le: {formatDate(order.completedDate)}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Relevés Techniques & Télémesure Réseau */}
            <div className="mb-4">
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span>1. Paramètres Techniques & Mesures de Performance (Télécoms / Starlink / LAN)</span>
                <span className="text-[10px] text-blue-300 font-normal">Relevé officiel certifié</span>
              </div>

              <div className="border border-t-0 border-slate-300 p-3 rounded-b bg-white">
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  {/* Starlink Metrics */}
                  <div className="border border-slate-200 rounded p-2 bg-slate-50">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Kit Starlink & Position</span>
                    <p className="font-semibold text-slate-900">
                      N° Kit / Dish: <span className="font-mono text-blue-800">{order.technicalDetails?.starlinkKitNumber || 'N/A'}</span>
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Angle: <span className="font-medium">{order.technicalDetails?.azimuthElevationAngle || '180° / 65°'}</span>
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Obstruction: <span className="font-medium text-emerald-700">{order.technicalDetails?.obstructionPercentage ?? 0}%</span>
                    </p>
                  </div>

                  {/* Speeds & Latency */}
                  <div className="border border-slate-200 rounded p-2 bg-emerald-50/50">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Débits Mesurés (Ookla)</span>
                    <p className="text-slate-700">
                      Download: <span className="font-bold text-emerald-700 text-sm">{order.technicalDetails?.downloadSpeedMbps ?? '—'} Mbps</span>
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Upload: <span className="font-bold text-cyan-700 text-sm">{order.technicalDetails?.uploadSpeedMbps ?? '—'} Mbps</span>
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Latence (Ping): <span className="font-bold text-slate-900">{order.technicalDetails?.latencyMs ?? '—'} ms</span>
                    </p>
                  </div>

                  {/* Network & WiFi */}
                  <div className="border border-slate-200 rounded p-2 bg-blue-50/50">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Paramètres Réseau & WiFi</span>
                    <p className="text-slate-700">
                      SSID: <span className="font-mono font-bold text-slate-900">{order.technicalDetails?.wifiSsid || 'N/A'}</span>
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Clé WiFi: <span className="font-mono text-slate-900">{order.technicalDetails?.wifiPassword || 'Transmis confidentiel'}</span>
                    </p>
                    <p className="text-slate-700 mt-0.5">
                      Passerelle LAN: <span className="font-mono text-slate-900">{order.technicalDetails?.ipLanGateway || '192.168.88.1/24'}</span>
                    </p>
                  </div>
                </div>

                {/* Additional row for IP and CCTV if present */}
                <div className="grid grid-cols-3 gap-3 text-[10px] mt-2 pt-2 border-t border-slate-200 text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">Adresse IP WAN: </span>
                    <span className="font-mono text-slate-900">{order.technicalDetails?.ipWan || 'Dynamic CGNAT'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">DNS: </span>
                    <span className="font-mono text-slate-900">{order.technicalDetails?.dnsServers || '1.1.1.1, 8.8.8.8'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Vidéosurveillance: </span>
                    <span className="text-slate-900">
                      {order.technicalDetails?.camerasCountInstalled ? `${order.technicalDetails.camerasCountInstalled} caméras connectées` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Tâches Réalisées & Prestations */}
            <div className="mb-4">
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider">
                2. Détail des Travaux & Prestations Exécutées
              </div>

              <div className="border border-t-0 border-slate-300 p-3 rounded-b bg-white">
                {order.tasksPerformed && order.tasksPerformed.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    {order.tasksPerformed.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-800">
                        <span className="w-3.5 h-3.5 rounded border border-emerald-600 bg-emerald-100 flex items-center justify-center shrink-0">
                          ✓
                        </span>
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">Installation complète et mise en conformité des liaisons réseaux.</p>
                )}
              </div>
            </div>

            {/* 5. Matériel & Consommables Utilisés */}
            {order.materialsUsed && order.materialsUsed.length > 0 && (
              <div className="mb-4">
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider">
                  3. Consommables & Équipements Fournis / Posés sur Site
                </div>
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Désignation du Matériel / Fourniture</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center w-24">Quantité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.materialsUsed.map((mat, idx) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="border border-slate-300 px-3 py-1 text-slate-800">{mat.name}</td>
                        <td className="border border-slate-300 px-3 py-1 text-center font-bold text-slate-900">{mat.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Photos du Chantier / Preuves d'Intervention */}
            {order.photos && order.photos.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wider block mb-1.5 flex items-center gap-1">
                  📸 Photographies Techniques & Preuves d'Installation ({order.photos.length}) :
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {order.photos.map((photo) => (
                    <div key={photo.id} className="border border-slate-300 rounded overflow-hidden bg-slate-50 text-[9px]">
                      <div className="relative aspect-video bg-slate-200">
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Photo'}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 bg-slate-900/80 text-white font-bold px-1 py-0.2 rounded text-[8px]">
                          {photo.stage === 'BEFORE' ? 'AVANT' : photo.stage === 'DURING' ? 'EN COURS' : 'APRÈS'}
                        </span>
                      </div>
                      <div className="p-1 text-slate-700 truncate font-medium">
                        {photo.caption || `Relevé ${photo.timestamp}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Observations & Recommandations */}
            <div className="mb-4 border border-slate-300 rounded p-2.5 bg-slate-50">
              <span className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                Observations Techniques & Conseils de Maintenance :
              </span>
              <p className="text-[11px] text-slate-700">
                {order.technicianNotes ||
                  "L'installation est conforme aux normes de transmission haute fréquence. Il est vivement conseillé de maintenir les équipements sur onduleur régulé et de vérifier périodiquement la visserie du mât après de fortes intempéries."}
              </p>
            </div>

            {/* 8. Clause de Réception, Avis & Doubles Signatures */}
            <div className="mt-4 border-t-2 border-slate-900 pt-3">
              <div className="text-[10px] text-slate-600 leading-snug mb-3">
                <span className="font-bold text-slate-900">Procès-Verbal de Réception Technique :</span> Le client ou son représentant désigné reconnaît avoir assisté aux tests de mise en service, constaté la conformité des débits de connexion Internet Starlink et la couverture Wi-Fi / CCTV. Les identifiants et accès ont été remis avec succès.
              </div>

              <div className="grid grid-cols-2 gap-6 text-[11px]">
                {/* Tech Lead Signature */}
                <div className="border border-slate-300 rounded p-2.5 text-center bg-slate-50 min-h-[135px] flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900 uppercase">Pour HIBTECH SERVICES SARL</p>
                    <p className="text-[10px] text-slate-500">Le Chef d'Équipe Technique / Installateur</p>
                  </div>

                  <div className="my-1.5 flex items-center justify-center gap-2">
                    {order.technicianSignatureBase64 && (
                      <img
                        src={order.technicianSignatureBase64}
                        alt="Signature Technicien"
                        className="h-12 max-w-[130px] object-contain border border-slate-200 bg-white rounded p-1"
                      />
                    )}
                    {settings.stampUrl ? (
                      <img src={settings.stampUrl} alt="Cachet" className="h-12 object-contain" />
                    ) : (
                      <div className="inline-block border-2 border-dashed border-blue-600/40 px-2 py-0.5 rounded text-[9px] text-blue-700 font-bold uppercase tracking-wider">
                        [ Cachet & Visa ]
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-slate-800">
                    {order.assignedTechnicians[0] || 'Prince Mukendi'}
                  </p>
                </div>

                {/* Client Signature */}
                <div className="border border-slate-300 rounded p-2.5 text-center bg-slate-50 min-h-[135px] flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900 uppercase">Pour le Client / Réceptionnaire</p>
                    <p className="text-[10px] text-slate-500">
                      Mention manuscrite "Bon pour réception et conformité des débits"
                    </p>
                  </div>

                  <div className="my-1.5 flex items-center justify-center">
                    {order.clientSignatureBase64 ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={order.clientSignatureBase64}
                          alt="Signature Client"
                          className="h-12 max-w-[170px] object-contain border border-slate-200 bg-white rounded p-1 shadow-sm"
                        />
                        <span className="text-[8px] text-emerald-700 font-semibold mt-0.5">
                          ✓ Signé numériquement sur tablette/smartphone
                        </span>
                      </div>
                    ) : order.signedByClient ? (
                      <div className="inline-block border border-emerald-600 bg-emerald-50 px-3 py-1 rounded text-[10px] text-emerald-800 font-bold">
                        ✓ Travaux Validés & Réceptionnés
                      </div>
                    ) : (
                      <div className="inline-block border-2 border-dashed border-slate-300 px-3 py-1 rounded text-[10px] text-slate-400">
                        Date, Nom & Signature Client
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-slate-800">
                    {order.clientName}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-500">
              HIBTECH SERVICES SARL • Télécoms, Fibre & Starlink RDC • Contact SAV 24/7: {settings.phone1 || '+243 82 000 1122'} • Document édité le {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
