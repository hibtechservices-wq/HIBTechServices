import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderTechnicalDetails } from '../../types';
import {
  Wrench,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Wifi,
  Radio,
  Video,
  Network,
  Calendar,
  User,
  MapPin,
  Activity,
  Layers,
  ShieldAlert,
  Camera,
  Image as ImageIcon,
  Upload,
  PenTool
} from 'lucide-react';
import { TouchSignaturePad } from './TouchSignaturePad';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: WorkOrder | null;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit
}) => {
  const { clients, addWorkOrder, updateWorkOrder, showNotification } = useApp();

  const [orderNumber, setOrderNumber] = useState('');
  const [type, setType] = useState<WorkOrderType>('INSTALLATION_STARLINK');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [status, setStatus] = useState<WorkOrderStatus>('SCHEDULED');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [assignedTechniciansInput, setAssignedTechniciansInput] = useState('Prince Mukendi (Tech Lead)');

  // Telemetry details
  const [technicalDetails, setTechnicalDetails] = useState<WorkOrderTechnicalDetails>({
    starlinkKitNumber: '',
    azimuthElevationAngle: 'Azimuth: 180° | Élévation: 65°',
    obstructionPercentage: 0,
    latencyMs: 38,
    downloadSpeedMbps: 180,
    uploadSpeedMbps: 25,
    ipWan: '100.84.10.15 (CGNAT)',
    ipLanGateway: '192.168.88.1/24',
    dnsServers: '1.1.1.1, 8.8.8.8',
    wifiSsid: 'HIBTECH_NETWORK_PRO',
    wifiPassword: '',
    frequencyBand: 'Dual Band 2.4 / 5 GHz',
    camerasCountInstalled: 0,
    nvrModel: '',
    nvrIpAddress: '',
    cloudP2pStatus: 'CONNECTED'
  });

  // Tasks executed
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Materials used
  const [materials, setMaterials] = useState<{ name: string; quantity: number }[]>([]);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQty, setNewMaterialQty] = useState(1);

  // Client validation & Touch Signatures
  const [clientFeedback, setClientFeedback] = useState<'EXCELLENT' | 'SATISFAIT' | 'RESERVES'>('SATISFAIT');
  const [clientFeedbackNotes, setClientFeedbackNotes] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [signedByClient, setSignedByClient] = useState(false);
  const [signedByTechnician, setSignedByTechnician] = useState(true);
  const [clientSignatureBase64, setClientSignatureBase64] = useState<string | undefined>(undefined);
  const [technicianSignatureBase64, setTechnicianSignatureBase64] = useState<string | undefined>(undefined);

  // Photos of intervention (Avant / En cours / Après)
  const [photos, setPhotos] = useState<{ id: string; url: string; caption: string; timestamp: string; stage: 'BEFORE' | 'DURING' | 'AFTER' }[]>([]);
  const [photoStage, setPhotoStage] = useState<'BEFORE' | 'DURING' | 'AFTER'>('AFTER');
  const [photoCaption, setPhotoCaption] = useState('');

  // Initialize form
  useEffect(() => {
    if (orderToEdit) {
      setOrderNumber(orderToEdit.orderNumber);
      setType(orderToEdit.type);
      setTitle(orderToEdit.title);
      setClientId(orderToEdit.clientId);
      setClientName(orderToEdit.clientName);
      setClientPhone(orderToEdit.clientPhone);
      setSiteName(orderToEdit.siteName);
      setSiteAddress(orderToEdit.siteAddress);
      setScheduledDate(orderToEdit.scheduledDate.substring(0, 10));
      setCompletedDate(orderToEdit.completedDate ? orderToEdit.completedDate.substring(0, 10) : '');
      setStatus(orderToEdit.status);
      setPriority(orderToEdit.priority);
      setAssignedTechniciansInput(orderToEdit.assignedTechnicians.join(', '));
      setTechnicalDetails(orderToEdit.technicalDetails || {});
      setTasks(orderToEdit.tasksPerformed || []);
      setMaterials(orderToEdit.materialsUsed || []);
      setClientFeedback(orderToEdit.clientFeedback || 'SATISFAIT');
      setClientFeedbackNotes(orderToEdit.clientFeedbackNotes || '');
      setTechnicianNotes(orderToEdit.technicianNotes || '');
      setSignedByClient(orderToEdit.signedByClient);
      setSignedByTechnician(orderToEdit.signedByTechnician);
      setClientSignatureBase64(orderToEdit.clientSignatureBase64);
      setTechnicianSignatureBase64(orderToEdit.technicianSignatureBase64);
      setPhotos(orderToEdit.photos || []);
    } else {
      const year = new Date().getFullYear();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      setOrderNumber(`OT-${year}-${randomId}`);
      setType('INSTALLATION_STARLINK');
      setTitle("Installation & Déploiement Kit Starlink avec Routeur et Câblage");
      setScheduledDate(new Date().toISOString().substring(0, 10));
      setCompletedDate('');
      setStatus('SCHEDULED');
      setPriority('NORMAL');
      setAssignedTechniciansInput('Prince Mukendi (Tech Lead), Alain Kalombo');
      setTasks([
        "Repérage de visibilité ciel et fixation sur mât rigide",
        "Tirage du câble réseau blindé extérieur (Cat6 UV)",
        "Configuration routeur MikroTik et sécurisation WiFi",
        "Test de débit (Speedtest Ookla) et mesure de latence",
        "Formation de l'administrateur site et remise fiche d'accès"
      ]);
      setMaterials([
        { name: 'Câble Cat6 FTP Cuivre pur Extérieur', quantity: 40 },
        { name: 'Connecteurs RJ45 blindés Cat6', quantity: 4 },
        { name: 'Support mât mural renforcé', quantity: 1 }
      ]);
      setSignedByClient(false);
      setSignedByTechnician(true);
      setClientSignatureBase64(undefined);
      setTechnicianSignatureBase64(undefined);
      setPhotos([]);
      if (clients.length > 0) {
        setClientId(clients[0].id);
        setClientName(clients[0].name);
        setClientPhone(clients[0].phone);
        setSiteName(clients[0].companyName || clients[0].name);
        setSiteAddress(clients[0].address || '');
      }
    }
  }, [orderToEdit, isOpen]);

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const selected = clients.find((c) => c.id === cId);
    if (selected) {
      setClientName(selected.name);
      setClientPhone(selected.phone);
      setSiteName(selected.companyName || selected.name);
      setSiteAddress(selected.address || '');
    }
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, newTaskInput.trim()]);
    setNewTaskInput('');
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleAddMaterial = () => {
    if (!newMaterialName.trim() || newMaterialQty <= 0) return;
    setMaterials([...materials, { name: newMaterialName.trim(), quantity: newMaterialQty }]);
    setNewMaterialName('');
    setNewMaterialQty(1);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification('La photo ne doit pas dépasser 5 Mo', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const url = uploadEvent.target?.result as string;
      const newPhoto = {
        id: `photo-${Date.now()}`,
        url,
        caption: photoCaption.trim() || 'Photo intervention',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        stage: photoStage
      };
      setPhotos((prev) => [...prev, newPhoto]);
      setPhotoCaption('');
      showNotification('Photo ajoutée à la fiche d’intervention', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber || !title || !clientName) {
      showNotification('Veuillez renseigner le numéro d’ordre, le titre et le client', 'error');
      return;
    }

    const techArray = assignedTechniciansInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const orderData = {
      orderNumber,
      type,
      title,
      clientId,
      clientName,
      clientPhone,
      siteName,
      siteAddress,
      scheduledDate,
      completedDate: completedDate || undefined,
      status,
      assignedTechnicians: techArray.length > 0 ? techArray : ['Équipe Technique HibTech'],
      priority,
      technicalDetails,
      tasksPerformed: tasks,
      materialsUsed: materials,
      clientFeedback,
      clientFeedbackNotes,
      technicianNotes,
      signedByClient: signedByClient || !!clientSignatureBase64,
      signedByTechnician,
      clientSignatureBase64,
      technicianSignatureBase64,
      photos
    };

    if (orderToEdit) {
      updateWorkOrder(orderToEdit.id, orderData);
      showNotification(`Ordre de mission ${orderNumber} mis à jour avec succès`, 'success');
    } else {
      addWorkOrder(orderData);
      showNotification(`Nouvel ordre de mission ${orderNumber} créé avec succès`, 'success');
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {orderToEdit ? `Modifier Ordre de Mission #${orderNumber}` : "Nouvel Ordre de Mission / Fiche d'Intervention"}
              </h2>
              <p className="text-xs text-slate-400">
                Intervention technique sur site, relevé des paramètres et visa client
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm text-slate-200">
          {/* Section 1: Informations Générales de la Mission */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 1. Informations Générales & Mission
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">N° Ordre de Mission *</label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type d'Intervention *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WorkOrderType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="INSTALLATION_STARLINK">Installation Starlink (Kit & Antenne)</option>
                  <option value="INSTALLATION_CCTV">Installation Vidéosurveillance IP / NVR</option>
                  <option value="CABLING_NETWORK">Câblage Réseau & Baie de Brassage</option>
                  <option value="ROUTER_WIFI_CONFIG">Config Routeur / Borne WiFi / VLAN</option>
                  <option value="MAINTENANCE_PREVENTIVE">Maintenance Préventive Trimestrielle</option>
                  <option value="MAINTENANCE_CURATIVE_SAV">Dépannage Curatif & SAV Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Priorité *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'URGENT' | 'CRITICAL')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="NORMAL">Normale (Standard)</option>
                  <option value="URGENT">Urgente (SLA &lt; 24h)</option>
                  <option value="CRITICAL">Critique / Arrêt Production (SLA &lt; 4h)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Intitulé / Objet de la Mission *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pose kit Starlink V3 Haute Performance et raccordement au switch MikroTik"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date Planifiée</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date de Clôture / Réalisation</label>
                <input
                  type="date"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Statut de la Mission</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="SCHEDULED">Planifiée / Ordre Émis</option>
                  <option value="IN_PROGRESS">En Cours sur Site</option>
                  <option value="COMPLETED">Travaux Terminés</option>
                  <option value="VALIDATED">Validée & Réceptionnée par Client</option>
                  <option value="CANCELLED">Annulée</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Techniciens Assignés (séparés par virgules)</label>
                <input
                  type="text"
                  value={assignedTechniciansInput}
                  onChange={(e) => setAssignedTechniciansInput(e.target.value)}
                  placeholder="Ex: Prince Mukendi (Chef d'équipe), Alain Kalombo, Patrick Mwamba"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Client & Localisation du Chantier */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> 2. Client & Site d'Intervention
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sélectionner un Client Enregistré</label>
                <select
                  value={clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Client ponctuel ou nouveau --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom du Client / Entreprise *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Téléphone de Contact</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nom du Site / Bâtiment</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Ex: Siège Direction Générale, Camp Minier Kolwezi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Adresse Complète du Site</label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="Ex: Avenue des Aviateurs, RDC"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Relevés & Paramètres Techniques (Starlink, CCTV, Réseau) */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Radio className="w-4 h-4" /> 3. Relevés & Mesures Techniques (Starlink / Réseau / CCTV)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">N° Kit Starlink / Serial Dish</label>
                <input
                  type="text"
                  value={technicalDetails.starlinkKitNumber || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, starlinkKitNumber: e.target.value })}
                  placeholder="Ex: KIT-0039281 / 2841-B890"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Orientation (Azimuth / Élévation)</label>
                <input
                  type="text"
                  value={technicalDetails.azimuthElevationAngle || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, azimuthElevationAngle: e.target.value })}
                  placeholder="Ex: Azimuth 182° | Élévation 64°"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Taux d'Obstruction (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={technicalDetails.obstructionPercentage ?? 0}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, obstructionPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Latence Moyenne (ms)</label>
                <input
                  type="number"
                  value={technicalDetails.latencyMs ?? ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, latencyMs: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 38"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Débit Descendant (Download Mbps)</label>
                <input
                  type="number"
                  value={technicalDetails.downloadSpeedMbps ?? ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, downloadSpeedMbps: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 195"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Débit Montant (Upload Mbps)</label>
                <input
                  type="number"
                  value={technicalDetails.uploadSpeedMbps ?? ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, uploadSpeedMbps: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 28"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">SSID WiFi Paramétré</label>
                <input
                  type="text"
                  value={technicalDetails.wifiSsid || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, wifiSsid: e.target.value })}
                  placeholder="Ex: HIBTECH_VIP_WIFI"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Clé / Mot de Passe WiFi</label>
                <input
                  type="text"
                  value={technicalDetails.wifiPassword || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, wifiPassword: e.target.value })}
                  placeholder="Ex: Hibtech2026Secure!"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Plage Fréquence WiFi</label>
                <input
                  type="text"
                  value={technicalDetails.frequencyBand || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, frequencyBand: e.target.value })}
                  placeholder="Ex: Dual Band 2.4GHz + 5GHz WiFi 6"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Passerelle LAN / Sous-réseau</label>
                <input
                  type="text"
                  value={technicalDetails.ipLanGateway || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, ipLanGateway: e.target.value })}
                  placeholder="Ex: 192.168.88.1/24"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Adresse IP WAN / Public ou CGNAT</label>
                <input
                  type="text"
                  value={technicalDetails.ipWan || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, ipWan: e.target.value })}
                  placeholder="Ex: 100.84.18.22 (Starlink CGNAT)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Serveurs DNS</label>
                <input
                  type="text"
                  value={technicalDetails.dnsServers || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, dnsServers: e.target.value })}
                  placeholder="Ex: 1.1.1.1, 8.8.8.8"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* CCTV specific */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Caméras Installées & Testées</label>
                <input
                  type="number"
                  value={technicalDetails.camerasCountInstalled ?? 0}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, camerasCountInstalled: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Modèle Enregistreur (NVR/DVR)</label>
                <input
                  type="text"
                  value={technicalDetails.nvrModel || ''}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, nvrModel: e.target.value })}
                  placeholder="Ex: Hikvision DS-7608NI-K2 / 8ch"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Accès Cloud P2P / Hik-Connect</label>
                <select
                  value={technicalDetails.cloudP2pStatus || 'CONNECTED'}
                  onChange={(e) => setTechnicalDetails({ ...technicalDetails, cloudP2pStatus: e.target.value as 'CONNECTED' | 'OFFLINE' })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="CONNECTED">En Ligne & Opérationnel</option>
                  <option value="OFFLINE">Hors-ligne / Configuration locale seule</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Liste des Tâches Exécutées */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 4. Tâches Réalisées & Prestations
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTask();
                  }
                }}
                placeholder="Ex: Sertissage prises RJ45 et test au réflectomètre / testeur réseau"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{task}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="p-1 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Matériel & Consommables Utilisés */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Layers className="w-4 h-4" /> 5. Matériel & Consommables Utilisés sur Site
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="Ex: Câble Cat6 Extérieur blindé, Embouts RJ45, Attaches câbles"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min="1"
                value={newMaterialQty}
                onChange={(e) => setNewMaterialQty(parseInt(e.target.value) || 1)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {materials.map((mat, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                  <span className="text-slate-200 font-medium">{mat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded text-[11px]">
                      Qté: {mat.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(idx)}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Photos d'Installation & Preuves de Terrain */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Camera className="w-4 h-4" /> 6. Photos de Chantier (Avant / Pendant / Après)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {photos.length} photo{photos.length > 1 ? 's' : ''} enregistrée{photos.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Photo upload bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div className="md:col-span-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Phase du Chantier</label>
                <select
                  value={photoStage}
                  onChange={(e) => setPhotoStage(e.target.value as 'BEFORE' | 'DURING' | 'AFTER')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="BEFORE">📷 Avant (Vue du site / Toit)</option>
                  <option value="DURING">⚙️ Pendant (Passage câbles)</option>
                  <option value="AFTER">✅ Après (Antenne & Débits)</option>
                </select>
              </div>

              <div className="md:col-span-5">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Légende / Emplacement</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Ex: Fixation mât sur cheminée avec haubans"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="md:col-span-4 flex items-end">
                <label className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/20 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Prendre / Charger Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Photo gallery thumbnails */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="relative aspect-video bg-black/40">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Photo intervention'}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        photo.stage === 'BEFORE'
                          ? 'bg-amber-500/90 text-slate-950'
                          : photo.stage === 'DURING'
                          ? 'bg-blue-500/90 text-white'
                          : 'bg-emerald-500/90 text-white'
                      }`}>
                        {photo.stage === 'BEFORE' ? 'AVANT' : photo.stage === 'DURING' ? 'PENDANT' : 'APRÈS'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md shadow-sm transition-opacity opacity-80 group-hover:opacity-100"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-2 text-[10px] text-slate-300 truncate">
                      {photo.caption || `Prise à ${photo.timestamp}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Avis Client, Visa & Double Signature Tactile */}
          <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> 7. Avis Client, Visa & Signatures Tactiles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Satisfaction Client</label>
                <select
                  value={clientFeedback}
                  onChange={(e) => setClientFeedback(e.target.value as 'EXCELLENT' | 'SATISFAIT' | 'RESERVES')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="EXCELLENT">⭐⭐⭐⭐⭐ Excellent (Débits et finitions parfaits)</option>
                  <option value="SATISFAIT">⭐⭐⭐⭐ Satisfaisant (Conforme au devis)</option>
                  <option value="RESERVES">⚠️ Avec réserves techniques</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Remarques ou Réserves du Client</label>
                <input
                  type="text"
                  value={clientFeedbackNotes}
                  onChange={(e) => setClientFeedbackNotes(e.target.value)}
                  placeholder="Ex: Travail soigné, débits mesurés conformes à plus de 180 Mbps"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes Internes du Technicien / Recommandations SAV</label>
                <textarea
                  rows={2}
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Ex: Prévoir un onduleur 1500VA pour protéger l'alimentation Starlink contre les micro-coupures SNEL"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Client Touch Signature */}
              <div className="p-3 bg-slate-900/80 border border-emerald-900/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">
                    Visa & Signature Client ("Bon pour Réception")
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signedByClient}
                      onChange={(e) => setSignedByClient(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0 w-3.5 h-3.5 bg-slate-800 border-slate-700"
                    />
                    Approuvé
                  </label>
                </div>

                <TouchSignaturePad
                  value={clientSignatureBase64}
                  onChange={(sig) => {
                    setClientSignatureBase64(sig);
                    setSignedByClient(true);
                  }}
                  label="Signature Tactile Client sur Écran"
                  signeeName={clientName || 'Client'}
                />
              </div>

              {/* Technician Signature */}
              <div className="p-3 bg-slate-900/80 border border-blue-900/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">
                    Visa du Chef d'Équipe Technique
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signedByTechnician}
                      onChange={(e) => setSignedByTechnician(e.target.checked)}
                      className="rounded text-blue-500 focus:ring-0 w-3.5 h-3.5 bg-slate-800 border-slate-700"
                    />
                    Certifié Conforme
                  </label>
                </div>

                <TouchSignaturePad
                  value={technicianSignatureBase64}
                  onChange={(sig) => {
                    setTechnicianSignatureBase64(sig);
                    setSignedByTechnician(true);
                  }}
                  label="Signature Chef d'Équipe HibTech"
                  signeeName={assignedTechniciansInput.split(',')[0] || 'Chef d’équipe'}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              {orderToEdit ? "Enregistrer les modifications" : "Créer l'Ordre de Mission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
