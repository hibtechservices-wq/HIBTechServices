import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkOrder, WorkOrderStatus, WorkOrderType } from '../../types';
import { formatDate } from '../../utils/formatters';
import { WorkOrderModal } from './WorkOrderModal';
import { WorkOrderPrintModal } from './WorkOrderPrintModal';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Edit,
  Trash2,
  ShieldAlert,
  Activity,
  Radio,
  Wifi,
  Video,
  User,
  Building,
  Filter,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const WorkOrdersList: React.FC = () => {
  const { workOrders, deleteWorkOrder, updateWorkOrder, showNotification } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<WorkOrder | null>(null);
  const [orderToPrint, setOrderToPrint] = useState<WorkOrder | null>(null);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.siteName && order.siteName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.assignedTechnicians.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.technicalDetails?.starlinkKitNumber &&
          order.technicalDetails.starlinkKitNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.technicalDetails?.wifiSsid &&
          order.technicalDetails.wifiSsid.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'ALL' || order.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [workOrders, searchTerm, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = workOrders.length;
    const completed = workOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'VALIDATED').length;
    const inProgress = workOrders.filter((o) => o.status === 'IN_PROGRESS').length;
    const scheduled = workOrders.filter((o) => o.status === 'SCHEDULED').length;
    const starlinkCount = workOrders.filter((o) => o.type === 'INSTALLATION_STARLINK').length;

    return { total, completed, inProgress, scheduled, starlinkCount };
  }, [workOrders]);

  const handleEdit = (order: WorkOrder) => {
    setOrderToEdit(order);
    setIsFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setOrderToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string, orderNumber: string) => {
    if (window.confirm(`Confirmez-vous la suppression de l'ordre de mission ${orderNumber} ?`)) {
      deleteWorkOrder(id);
      showNotification(`Ordre de mission ${orderNumber} supprimé`, 'info');
    }
  };

  const handleQuickValidate = (order: WorkOrder) => {
    updateWorkOrder(order.id, {
      status: 'VALIDATED',
      completedDate: new Date().toISOString(),
      signedByClient: true,
      clientFeedback: 'EXCELLENT'
    });
    showNotification(`Ordre de mission ${order.orderNumber} validé avec visa client`, 'success');
  };

  const getTypeBadge = (type: WorkOrderType) => {
    switch (type) {
      case 'INSTALLATION_STARLINK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-3.5 h-3.5" /> Starlink
          </span>
        );
      case 'INSTALLATION_CCTV':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Video className="w-3.5 h-3.5" /> CCTV IP
          </span>
        );
      case 'CABLING_NETWORK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-3.5 h-3.5" /> Câblage
          </span>
        );
      case 'ROUTER_WIFI_CONFIG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wifi className="w-3.5 h-3.5" /> Router / WiFi
          </span>
        );
      case 'MAINTENANCE_PREVENTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5" /> Maint. Prév.
          </span>
        );
      case 'MAINTENANCE_CURATIVE_SAV':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" /> SAV Urgent
          </span>
        );
    }
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Validé Client
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terminé
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> En Cours
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Planifié
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            Annulé
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Total Ordres de Mission</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Terminées & Validées</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{stats.completed}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">En Cours sur Site</p>
            <p className="text-2xl font-bold text-blue-400 mt-0.5">{stats.inProgress}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Déploiements Starlink</p>
            <p className="text-2xl font-bold text-purple-400 mt-0.5">{stats.starlinkCount}</p>
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher N° ordre, client, technicien, kit Starlink, SSID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tous les types</option>
              <option value="INSTALLATION_STARLINK">Starlink</option>
              <option value="INSTALLATION_CCTV">CCTV IP</option>
              <option value="CABLING_NETWORK">Câblage</option>
              <option value="ROUTER_WIFI_CONFIG">WiFi & Routeur</option>
              <option value="MAINTENANCE_PREVENTIVE">Maintenance Prév.</option>
              <option value="MAINTENANCE_CURATIVE_SAV">SAV Urgent</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="SCHEDULED">Planifié</option>
              <option value="IN_PROGRESS">En Cours</option>
              <option value="COMPLETED">Terminé</option>
              <option value="VALIDATED">Validé Client</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouvel Ordre de Mission
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">N° Ordre & Date</th>
                <th className="px-4 py-3.5">Type & Mission</th>
                <th className="px-4 py-3.5">Client & Site</th>
                <th className="px-4 py-3.5">Techniciens Assignés</th>
                <th className="px-4 py-3.5">Télémesure / Débits Relevés</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-base font-medium text-slate-400">Aucun ordre de mission trouvé</p>
                    <p className="text-xs text-slate-500 mt-1">Créez une nouvelle fiche d'intervention technique.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white font-mono flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{order.orderNumber}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDate(order.scheduledDate)}
                      </div>
                      {order.priority !== 'NORMAL' && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 border border-red-800/60 text-red-400">
                          {order.priority}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div>{getTypeBadge(order.type)}</div>
                      <div className="font-medium text-slate-100 text-xs mt-1.5 line-clamp-1 max-w-[220px]" title={order.title}>
                        {order.title}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {order.clientName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[180px]" title={order.siteName || order.siteAddress}>
                          {order.siteName || order.siteAddress}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      <div className="font-medium text-slate-200">
                        {order.assignedTechnicians.slice(0, 2).join(', ')}
                      </div>
                      {order.assignedTechnicians.length > 2 && (
                        <div className="text-[11px] text-slate-400">
                          +{order.assignedTechnicians.length - 2} autre(s)
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {order.technicalDetails && (order.technicalDetails.downloadSpeedMbps || order.technicalDetails.latencyMs) ? (
                        <div className="space-y-0.5 text-xs">
                          {order.technicalDetails.downloadSpeedMbps && (
                            <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>{order.technicalDetails.downloadSpeedMbps} Mbps</span>
                              {order.technicalDetails.latencyMs && (
                                <span className="text-slate-400 font-normal">({order.technicalDetails.latencyMs} ms)</span>
                              )}
                            </div>
                          )}
                          {order.technicalDetails.wifiSsid && (
                            <div className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                              SSID: {order.technicalDetails.wifiSsid}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Mesures en attente</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status !== 'VALIDATED' && (
                          <button
                            onClick={() => handleQuickValidate(order)}
                            title="Valider la réception avec visa client"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setOrderToPrint(order)}
                          title="Imprimer Fiche d'Intervention (Direct Imprimante & PDF C:\hibtech)"
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(order)}
                          title="Modifier l'ordre de mission"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(order.id, order.orderNumber)}
                          title="Supprimer"
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <WorkOrderModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setOrderToEdit(null);
        }}
        orderToEdit={orderToEdit}
      />

      {/* Print & PDF Modal */}
      <WorkOrderPrintModal
        order={orderToPrint}
        onClose={() => setOrderToPrint(null)}
      />
    </div>
  );
};
