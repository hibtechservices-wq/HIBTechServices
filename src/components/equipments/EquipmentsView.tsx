import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NetworkEquipment, EquipmentType, EquipmentStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelUtils';
import { EquipmentModal } from './EquipmentModal';
import { EquipmentDetailsModal } from './EquipmentDetailsModal';
import { EquipmentPrintModal } from './EquipmentPrintModal';
import { EquipmentsReportModal } from './EquipmentsReportModal';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { DeliveryNotesList } from '../operations/DeliveryNotesList';
import { WorkOrdersList } from '../operations/WorkOrdersList';
import { SubscriptionsList } from '../operations/SubscriptionsList';
import { StarlinkSupervisionDashboard } from './StarlinkSupervisionDashboard';
import {
  Radio,
  Video,
  HardDrive,
  Router as RouterIcon,
  Wifi,
  Plus,
  Search,
  Printer,
  Upload,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Shield,
  Tag,
  FileSpreadsheet,
  Truck,
  Wrench,
  CreditCard,
} from 'lucide-react';

export const EquipmentsView: React.FC = () => {
  const { equipments, deleteEquipment, clients, deliveryNotes, workOrders, subscriptions } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'PARC' | 'SUPERVISION' | 'DELIVERY_NOTES' | 'WORK_ORDERS' | 'SUBSCRIPTIONS'>('PARC');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | EquipmentType>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | EquipmentStatus>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<EquipmentType>('STARLINK');
  const [equipmentToEdit, setEquipmentToEdit] = useState<NetworkEquipment | null>(null);
  const [equipmentToView, setEquipmentToView] = useState<NetworkEquipment | null>(null);
  const [equipmentToPrint, setEquipmentToPrint] = useState<NetworkEquipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<NetworkEquipment | null>(null);

  // Filtered equipments
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      const matchSearch =
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (eq.macAddress && eq.macAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (eq.assignedTechnician && eq.assignedTechnician.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (eq.starlink?.publicIpOrCgnat && eq.starlink.publicIpOrCgnat.includes(searchQuery)) ||
        (eq.cctvCamera?.ipAddress && eq.cctvCamera.ipAddress.includes(searchQuery)) ||
        (eq.nvrDvr?.ipAddress && eq.nvrDvr.ipAddress.includes(searchQuery)) ||
        (eq.router?.ipLanGateway && eq.router.ipLanGateway.includes(searchQuery)) ||
        (eq.accessPoint?.ipAddress && eq.accessPoint.ipAddress.includes(searchQuery));

      const matchType = selectedType === 'ALL' || eq.type === selectedType;
      const matchStatus = selectedStatus === 'ALL' || eq.status === selectedStatus;
      const matchClient = selectedClientId === 'ALL' || eq.clientId === selectedClientId;

      return matchSearch && matchType && matchStatus && matchClient;
    });
  }, [equipments, searchQuery, selectedType, selectedStatus, selectedClientId]);

  // Metrics
  const starlinkCount = useMemo(() => equipments.filter((e) => e.type === 'STARLINK').length, [equipments]);
  const cctvCount = useMemo(() => equipments.filter((e) => e.type === 'CCTV_CAMERA').length, [equipments]);
  const nvrCount = useMemo(() => equipments.filter((e) => e.type === 'NVR_DVR').length, [equipments]);
  const routerCount = useMemo(() => equipments.filter((e) => e.type === 'ROUTER').length, [equipments]);
  const apCount = useMemo(() => equipments.filter((e) => e.type === 'ACCESS_POINT').length, [equipments]);
  const activeCount = useMemo(() => equipments.filter((e) => e.status === 'ACTIVE').length, [equipments]);
  const maintenanceCount = useMemo(() => equipments.filter((e) => e.status === 'MAINTENANCE' || e.status === 'OFFLINE').length, [equipments]);

  const subAlertCount = useMemo(() => {
    return subscriptions.filter((s) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(s.nextBillingDate);
      due.setHours(0, 0, 0, 0);
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return s.status === 'OVERDUE' || diff <= 7;
    }).length;
  }, [subscriptions]);

  const pendingDeliveriesCount = useMemo(() => {
    return deliveryNotes.filter((n) => n.status === 'PENDING' || n.status === 'IN_TRANSIT').length;
  }, [deliveryNotes]);

  const openMissionsCount = useMemo(() => {
    return workOrders.filter((o) => o.status === 'SCHEDULED' || o.status === 'IN_PROGRESS').length;
  }, [workOrders]);

  const handleExportExcel = () => {
    const data = filteredEquipments.map((eq) => ({
      Nom_Equipement: eq.name,
      Type: eq.type,
      Client: eq.clientName,
      Site: eq.siteName,
      Numero_Serie: eq.serialNumber,
      Adresse_MAC: eq.macAddress || '',
      Statut: eq.status,
      Date_Installation: eq.installationDate,
      Technicien: eq.assignedTechnician || '',
      // Starlink
      Starlink_KitNumber: eq.starlink?.kitNumber || '',
      Starlink_Plan: eq.starlink?.subscriptionPlan || '',
      Starlink_IP: eq.starlink?.publicIpOrCgnat || '',
      Starlink_SSID: eq.starlink?.wifiSsid || '',
      // CCTV
      Camera_Marque: eq.cctvCamera?.brand || '',
      Camera_Model: eq.cctvCamera?.model || '',
      Camera_IP: eq.cctvCamera?.ipAddress || '',
      Camera_Resolution: eq.cctvCamera?.resolution || '',
      // NVR
      NVR_Marque: eq.nvrDvr?.brand || '',
      NVR_IP: eq.nvrDvr?.ipAddress || '',
      NVR_Canaux: eq.nvrDvr?.channelCount || '',
      // Router
      Router_Marque: eq.router?.brand || '',
      Router_IP_LAN: eq.router?.ipLanGateway || '',
      // AP
      AP_Marque: eq.accessPoint?.brand || '',
      AP_IP: eq.accessPoint?.ipAddress || '',
      AP_SSID: eq.accessPoint?.primarySsid || '',
      Notes: eq.notes || '',
    }));
    exportToExcel(`CongoBiz_Parc_Equipements_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { sheetName: 'Parc_Equipements', data },
    ]);
  };

  const getEquipmentTypeIcon = (type: EquipmentType) => {
    switch (type) {
      case 'STARLINK':
        return <Radio className="w-4 h-4 text-sky-600" />;
      case 'CCTV_CAMERA':
        return <Video className="w-4 h-4 text-emerald-600" />;
      case 'NVR_DVR':
        return <HardDrive className="w-4 h-4 text-purple-600" />;
      case 'ROUTER':
        return <RouterIcon className="w-4 h-4 text-amber-600" />;
      case 'ACCESS_POINT':
        return <Wifi className="w-4 h-4 text-teal-600" />;
      default:
        return <Server className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getEquipmentTypeBadge = (type: EquipmentType) => {
    switch (type) {
      case 'STARLINK':
        return { label: 'Starlink', class: 'bg-sky-100 text-sky-800' };
      case 'CCTV_CAMERA':
        return { label: 'Caméra CCTV', class: 'bg-emerald-100 text-emerald-800' };
      case 'NVR_DVR':
        return { label: 'NVR / DVR', class: 'bg-purple-100 text-purple-800' };
      case 'ROUTER':
        return { label: 'Routeur / VPN', class: 'bg-amber-100 text-amber-900' };
      case 'ACCESS_POINT':
        return { label: 'Point d\'Accès AP', class: 'bg-teal-100 text-teal-900' };
      default:
        return { label: 'Switch / Autre', class: 'bg-neutral-100 text-neutral-800' };
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Opérations, Terrain & Parc Réseau
            </h1>
            <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full uppercase">
              Starlink · Vidéosurveillance · Télécoms RDC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Bons de livraison (BL), fiches d'intervention technique, suivi des abonnements Starlink récurrents & contrats SAV.
          </p>
        </div>

        {/* 4 Operations Sub-Tabs Navigation */}
        <div className="flex border-b border-neutral-200 gap-1 sm:gap-3 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setActiveSubTab('PARC')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'PARC'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Server className="w-4 h-4 text-sky-600" />
            <span>Parc Équipements & Réseau</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700">
              {equipments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('SUPERVISION')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'SUPERVISION'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-600" />
            <span>Supervision Starlink (1TB & Télémétrie)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
              {starlinkCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('DELIVERY_NOTES')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'DELIVERY_NOTES'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Bons de Livraison & Décharges (BL)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
              {deliveryNotes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('WORK_ORDERS')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'WORK_ORDERS'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Ordres de Mission & Interventions</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
              {workOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('SUBSCRIPTIONS')}
            className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'SUBSCRIPTIONS'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-purple-600" />
            <span>Abonnements & Contrats SAV</span>
            {subAlertCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                {subAlertCount} alerte(s)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                {subscriptions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab: Supervision Starlink */}
      {activeSubTab === 'SUPERVISION' && <StarlinkSupervisionDashboard />}

      {/* Tab 2: Bons de Livraison */}
      {activeSubTab === 'DELIVERY_NOTES' && <DeliveryNotesList />}

      {/* Tab 3: Ordres de Mission */}
      {activeSubTab === 'WORK_ORDERS' && <WorkOrdersList />}

      {/* Tab 4: Abonnements & Contrats SAV */}
      {activeSubTab === 'SUBSCRIPTIONS' && <SubscriptionsList />}

      {/* Tab 1: Parc Équipements Original */}
      {activeSubTab === 'PARC' && (
        <div className="space-y-6">
          {/* Action Buttons on single line under the title */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* PDF Fleet Report Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
              title="Générer et télécharger l'inventaire complet du parc en PDF"
            >
            <Printer className="w-3.5 h-3.5 text-emerald-200" />
            <span>État Parc (PDF)</span>
          </button>

          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            className="h-8 px-3 bg-white hover:bg-emerald-50 border border-neutral-300 hover:border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
            title="Exporter tout le parc vers un fichier Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Excel Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="h-8 px-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
            title="Importer des équipements depuis un fichier Excel (.xlsx, .xls)"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-600" />
            <span>Importer Excel</span>
          </button>

          {/* New Equipment Dropdown / Buttons */}
          <button
            onClick={() => {
              setEquipmentToEdit(null);
              setCreateDefaultType('STARLINK');
              setIsCreateModalOpen(true);
            }}
            className="h-8 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Nouvel Équipement</span>
          </button>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Total Parc</span>
            <Server className="w-4 h-4 text-neutral-400" />
          </div>
          <span className="text-lg font-black text-neutral-900 font-mono-nums block mt-1">
            {equipments.length}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">{activeCount} en service</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-700 uppercase">Kits Starlink</span>
            <Radio className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-lg font-black text-sky-950 font-mono-nums block mt-1">
            {starlinkCount}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium">Satellites RDC</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Caméras CCTV</span>
            <Video className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-lg font-black text-emerald-950 font-mono-nums block mt-1">
            {cctvCount}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium">Flux vidéo IP</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-700 uppercase">NVR / DVR</span>
            <HardDrive className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-lg font-black text-purple-950 font-mono-nums block mt-1">
            {nvrCount}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium">Enregistreurs</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Routeurs & APs</span>
            <RouterIcon className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-lg font-black text-amber-950 font-mono-nums block mt-1">
            {routerCount + apCount}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium">Passerelles / Wi-Fi</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 uppercase">Maintenance</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-lg font-black text-rose-700 font-mono-nums block mt-1">
            {maintenanceCount}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">À vérifier</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Equipment Types Tabs */}
          <div className="flex bg-neutral-100 p-0.5 rounded-lg text-xs w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'ALL', label: 'Tous', count: equipments.length },
              { id: 'STARLINK', label: 'Starlink', count: starlinkCount, icon: Radio },
              { id: 'CCTV_CAMERA', label: 'Caméras IP', count: cctvCount, icon: Video },
              { id: 'NVR_DVR', label: 'NVR / DVR', count: nvrCount, icon: HardDrive },
              { id: 'ROUTER', label: 'Routeurs', count: routerCount, icon: RouterIcon },
              { id: 'ACCESS_POINT', label: 'Wi-Fi AP', count: apCount, icon: Wifi },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  selectedType === tab.id
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700 font-mono-nums">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher IP, S/N, client, site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:bg-white"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Client & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-semibold text-[11px]">Client :</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1 text-xs text-neutral-900 focus:outline-none"
              >
                <option value="ALL">Tous les clients ({clients.length})</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-semibold text-[11px]">Statut :</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1 text-xs text-neutral-900 focus:outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">🟢 En Service</option>
                <option value="MAINTENANCE">🟡 En Maintenance</option>
                <option value="OFFLINE">🔴 Hors Ligne</option>
                <option value="IN_STOCK">📦 En Stock</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500 font-medium font-mono-nums">
              {filteredEquipments.length} équipement(s) affiché(s)
            </span>
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                onClick={() => setViewMode('GRID')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  viewMode === 'GRID' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                }`}
              >
                Cartes
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  viewMode === 'TABLE' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                }`}
              >
                Tableau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content: Cards View or Table View */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipments.length === 0 ? (
            <div className="col-span-full py-16 bg-white rounded-xl border border-neutral-200 text-center text-neutral-400 text-xs">
              Aucun équipement ne correspond à vos critères de recherche.
            </div>
          ) : (
            filteredEquipments.map((eq) => {
              const badge = getEquipmentTypeBadge(eq.type);
              const ipAddress =
                eq.starlink?.publicIpOrCgnat ||
                eq.cctvCamera?.ipAddress ||
                eq.nvrDvr?.ipAddress ||
                eq.router?.ipLanGateway ||
                eq.accessPoint?.ipAddress;

              return (
                <div
                  key={eq.id}
                  className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-4 flex flex-col justify-between hover:border-neutral-300 transition-all group"
                >
                  <div>
                    {/* Top Row: Type Badge, Status, Action icons */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-neutral-100 rounded-lg">
                          {getEquipmentTypeIcon(eq.type)}
                        </div>
                        <div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${badge.class}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-neutral-400 block font-mono-nums mt-0.5">
                            S/N: {eq.serialNumber}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          eq.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : eq.status === 'MAINTENANCE'
                            ? 'bg-amber-100 text-amber-800'
                            : eq.status === 'OFFLINE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {eq.status === 'ACTIVE' ? 'En Service' : eq.status === 'MAINTENANCE' ? 'Maintenance' : eq.status === 'OFFLINE' ? 'Hors Ligne' : 'En Stock'}
                      </span>
                    </div>

                    {/* Equipment Name */}
                    <h3 className="font-bold text-sm text-neutral-900 leading-snug group-hover:text-amber-600 transition-colors">
                      {eq.name}
                    </h3>

                    {/* Client & Site */}
                    <div className="mt-2 space-y-1 text-xs text-neutral-600">
                      <div className="flex items-center gap-1.5 font-medium text-neutral-900">
                        <span className="text-neutral-400 font-normal">Client :</span>
                        <span className="truncate">{eq.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{eq.siteName}</span>
                      </div>
                      {ipAddress && (
                        <div className="flex items-center gap-1.5 font-mono-nums">
                          <span className="text-neutral-400">IP :</span>
                          <span className="font-bold text-neutral-800">{ipAddress}</span>
                        </div>
                      )}
                      {eq.starlink?.wifiSsid && (
                        <div className="flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="font-medium text-sky-900 truncate">SSID: {eq.starlink.wifiSsid}</span>
                        </div>
                      )}
                      {eq.accessPoint?.primarySsid && (
                        <div className="flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-medium text-teal-900 truncate">SSID: {eq.accessPoint.primarySsid}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      onClick={() => setEquipmentToView(eq)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Détails & Clés</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEquipmentToPrint(eq)}
                        className="p-1.5 text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        title="Fiche Technique PDF A4"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEquipmentToEdit(eq);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEquipmentToDelete(eq)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50 text-neutral-700 uppercase font-semibold text-[10px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Équipement / Désignation</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Site / Emplacement</th>
                  <th className="py-3 px-4 font-mono-nums">Adresse IP</th>
                  <th className="py-3 px-4 font-mono-nums">N° Série</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400 text-xs">
                      Aucun équipement trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredEquipments.map((eq) => {
                    const badge = getEquipmentTypeBadge(eq.type);
                    const ipAddress =
                      eq.starlink?.publicIpOrCgnat ||
                      eq.cctvCamera?.ipAddress ||
                      eq.nvrDvr?.ipAddress ||
                      eq.router?.ipLanGateway ||
                      eq.accessPoint?.ipAddress ||
                      '—';

                    return (
                      <tr key={eq.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-900">
                          <div>
                            <span className="block">{eq.name}</span>
                            {eq.assignedTechnician && (
                              <span className="text-[10px] text-neutral-400 font-normal">
                                Tech: {eq.assignedTechnician}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${badge.class}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-neutral-900">
                          {eq.clientName}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-600">
                          {eq.siteName}
                        </td>

                        <td className="py-3.5 px-4 font-mono-nums font-bold text-neutral-800">
                          {ipAddress}
                        </td>

                        <td className="py-3.5 px-4 font-mono-nums text-neutral-500">
                          {eq.serialNumber}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              eq.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : eq.status === 'MAINTENANCE'
                                ? 'bg-amber-100 text-amber-800'
                                : eq.status === 'OFFLINE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {eq.status === 'ACTIVE' ? 'En Service' : eq.status === 'MAINTENANCE' ? 'Maintenance' : eq.status === 'OFFLINE' ? 'Hors Ligne' : 'En Stock'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEquipmentToView(eq)}
                              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                              title="Détails"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEquipmentToPrint(eq)}
                              className="p-1.5 text-neutral-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Fiche PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEquipmentToEdit(eq);
                                setIsCreateModalOpen(true);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEquipmentToDelete(eq)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

      {/* Create / Edit Modal */}
      <EquipmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEquipmentToEdit(null);
        }}
        equipmentToEdit={equipmentToEdit}
        defaultType={createDefaultType}
      />

      {/* Details Modal */}
      <EquipmentDetailsModal
        equipment={equipmentToView}
        onClose={() => setEquipmentToView(null)}
        onEdit={(eq) => {
          setEquipmentToView(null);
          setEquipmentToEdit(eq);
          setIsCreateModalOpen(true);
        }}
        onPrint={(eq) => {
          setEquipmentToView(null);
          setEquipmentToPrint(eq);
        }}
      />

      {/* Print Technical Sheet Modal */}
      <EquipmentPrintModal
        equipment={equipmentToPrint}
        onClose={() => setEquipmentToPrint(null)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(equipmentToDelete)}
        title="Supprimer l'équipement du parc ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement "${equipmentToDelete?.name}" ?`}
        details={equipmentToDelete ? `S/N: ${equipmentToDelete.serialNumber} · Client: ${equipmentToDelete.clientName} (${equipmentToDelete.siteName})` : ''}
        confirmText="Supprimer"
        onConfirm={() => {
          if (equipmentToDelete) {
            deleteEquipment(equipmentToDelete.id);
            setEquipmentToDelete(null);
          }
        }}
        onCancel={() => setEquipmentToDelete(null)}
      />

      {/* PDF Fleet Inventory Report Modal */}
      <EquipmentsReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleType="EQUIPMENTS"
        title="Importer des Équipements Réseaux & Sécurité depuis Excel / CSV"
      />
    </div>
  );
};
