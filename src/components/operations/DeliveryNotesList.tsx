import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryNote, DeliveryStatus } from '../../types';
import { formatDate } from '../../utils/formatters';
import { DeliveryNoteModal } from './DeliveryNoteModal';
import { DeliveryNotePrintModal } from './DeliveryNotePrintModal';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Edit,
  Trash2,
  ShieldCheck,
  PackageCheck,
  Building,
  User,
  ArrowRight,
  Filter
} from 'lucide-react';

export const DeliveryNotesList: React.FC = () => {
  const { deliveryNotes, deleteDeliveryNote, updateDeliveryNote, showNotification } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<DeliveryNote | null>(null);
  const [noteToPrint, setNoteToPrint] = useState<DeliveryNote | null>(null);

  // Filtered Delivery Notes
  const filteredNotes = useMemo(() => {
    return deliveryNotes.filter((note) => {
      const matchesSearch =
        note.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.siteName && note.siteName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.transporterName && note.transporterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        note.items.some((it) =>
          it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (it.serialNumber && it.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );

      const matchesStatus = statusFilter === 'ALL' || note.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deliveryNotes, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = deliveryNotes.length;
    const delivered = deliveryNotes.filter((n) => n.status === 'DELIVERED').length;
    const inTransit = deliveryNotes.filter((n) => n.status === 'IN_TRANSIT').length;
    const pending = deliveryNotes.filter((n) => n.status === 'PENDING').length;
    const signedCount = deliveryNotes.filter((n) => n.signedByClient).length;

    return { total, delivered, inTransit, pending, signedCount };
  }, [deliveryNotes]);

  const handleEdit = (note: DeliveryNote) => {
    setNoteToEdit(note);
    setIsFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setNoteToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string, deliveryNumber: string) => {
    if (window.confirm(`Confirmez-vous la suppression du Bon de Livraison ${deliveryNumber} ?`)) {
      deleteDeliveryNote(id);
      showNotification(`Bon de livraison ${deliveryNumber} supprimé`, 'info');
    }
  };

  const handleQuickMarkDelivered = (note: DeliveryNote) => {
    updateDeliveryNote(note.id, {
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      signedByClient: true,
      recipientName: note.recipientName || note.clientName,
      recipientTitle: note.recipientTitle || 'Réceptionnaire Site'
    });
    showNotification(`BL ${note.deliveryNumber} marqué comme livré et déchargé`, 'success');
  };

  const getStatusBadge = (status: DeliveryStatus, signed: boolean) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {signed ? 'Livré & Déchargé' : 'Livré (Sans visa)'}
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            En Acheminement
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Préparation Dépôt
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
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
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Total Bons de Livraison</p>
            <p className="text-2xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">Livrés & Déchargés</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{stats.delivered}</p>
            <p className="text-[11px] text-slate-400">{stats.signedCount} visés par le client</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">En Cours de Transit</p>
            <p className="text-2xl font-bold text-cyan-400 mt-0.5">{stats.inTransit}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-medium text-slate-400">En Attente Dépôt</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">{stats.pending}</p>
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
              placeholder="Rechercher N° BL, client, chantier, S/N matériel, transporteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">Préparation Dépôt</option>
              <option value="IN_TRANSIT">En Acheminement</option>
              <option value="DELIVERED">Livrés & Déchargés</option>
              <option value="CANCELLED">Annulés</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouveau Bon de Livraison (BL)
        </button>
      </div>

      {/* Delivery Notes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">N° BL & Date</th>
                <th className="px-4 py-3.5">Client & Destination</th>
                <th className="px-4 py-3.5">Équipements & S/N Déchargés</th>
                <th className="px-4 py-3.5">Transporteur</th>
                <th className="px-4 py-3.5">Statut & Décharge</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <PackageCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-base font-medium text-slate-400">Aucun bon de livraison trouvé</p>
                    <p className="text-xs text-slate-500 mt-1">Créez un nouveau BL ou modifiez vos critères de recherche.</p>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{note.deliveryNumber}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDate(note.date)}
                      </div>
                      {note.saleNumber && (
                        <div className="text-[11px] font-mono text-cyan-400/90 mt-1">
                          Lié à Facture #{note.saleNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {note.clientName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[200px]" title={note.siteName || note.deliveryAddress}>
                          {note.siteName ? `${note.siteName} — ` : ''}{note.deliveryAddress}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tél: {note.clientPhone}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1 max-w-[260px]">
                        {note.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-200 flex items-start justify-between gap-2">
                            <span className="truncate font-medium">
                              {item.quantity}x {item.name}
                            </span>
                            {item.serialNumber && (
                              <span className="font-mono text-[10px] text-blue-300 bg-blue-950/70 border border-blue-800/50 px-1.5 py-0.5 rounded shrink-0">
                                S/N: {item.serialNumber}
                              </span>
                            )}
                          </div>
                        ))}
                        {note.items.length > 2 && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            +{note.items.length - 2} autre(s) équipement(s)...
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      <div className="font-medium text-slate-200">{note.transporterName}</div>
                      {note.vehiclePlate && (
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Véhicule: {note.vehiclePlate}
                        </div>
                      )}
                      {note.recipientName && (
                        <div className="text-[11px] text-emerald-400/90 mt-1">
                          Réceptionné par: {note.recipientName}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(note.status, note.signedByClient)}
                        {note.signedByClient ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Décharge signée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/80">
                            En attente signature
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {note.status !== 'DELIVERED' && (
                          <button
                            onClick={() => handleQuickMarkDelivered(note)}
                            title="Marquer comme livré et déchargé"
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setNoteToPrint(note)}
                          title="Imprimer BL & Décharge (Direct Imprimante & PDF C:\hibtech)"
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(note)}
                          title="Modifier le Bon de Livraison"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(note.id, note.deliveryNumber)}
                          title="Supprimer"
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* Modal d'édition/création */}
      <DeliveryNoteModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
      />

      {/* Modal d'impression officielle & PDF direct */}
      <DeliveryNotePrintModal
        note={noteToPrint}
        onClose={() => setNoteToPrint(null)}
      />
    </div>
  );
};
