import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLogEntry, AuditActionType } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelUtils';
import {
  ShieldAlert,
  X,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  User,
  Shield,
  Trash2,
  Percent,
  RefreshCw,
  Tag,
  Truck,
} from 'lucide-react';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useApp();

  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = useMemo(() => {
    if (!isOpen) return [];
    return auditLogs.filter((log) => {
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          log.title.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [isOpen, auditLogs, selectedAction, selectedSeverity, searchQuery]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    const data = filteredLogs.map((l) => ({
      Date: l.timestamp,
      Action: l.action,
      Gravite: l.severity,
      Titre: l.title,
      Details: l.details,
      Utilisateur: l.userName,
      Role: l.userRole,
    }));
    exportToExcel(`Journal_Audit_Securite_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { sheetName: 'Journal_Audit_Sécurité', data },
    ]);
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'PRICE_CHANGE':
        return { label: 'Modification Prix', icon: Tag, color: 'bg-amber-100 text-amber-800' };
      case 'HIGH_DISCOUNT':
        return { label: 'Remise Élevée (>10%)', icon: Percent, color: 'bg-purple-100 text-purple-800' };
      case 'SALE_DELETE':
        return { label: 'Suppression Facture/Ticket', icon: Trash2, color: 'bg-rose-100 text-rose-800' };
      case 'EXCHANGE_RATE_CHANGE':
        return { label: 'Taux Officiel BCC', icon: RefreshCw, color: 'bg-blue-100 text-blue-800' };
      case 'STOCK_PURCHASE':
        return { label: 'Entrée Stock Fournisseur', icon: Truck, color: 'bg-emerald-100 text-emerald-800' };
      case 'STOCK_ADJUSTMENT':
        return { label: 'Ajustement Inventaire', icon: AlertTriangle, color: 'bg-neutral-100 text-neutral-800' };
      case 'SESSION_DELETE':
        return { label: 'Suppression Session Caisse', icon: Trash2, color: 'bg-rose-100 text-rose-800' };
      default:
        return { label: action, icon: Shield, color: 'bg-neutral-100 text-neutral-800' };
    }
  };

  const getSeverityBadge = (severity: 'INFO' | 'WARNING' | 'CRITICAL') => {
    switch (severity) {
      case 'CRITICAL':
        return { label: 'Critique', color: 'bg-rose-600 text-white' };
      case 'WARNING':
        return { label: 'Avertissement', color: 'bg-amber-500 text-white' };
      case 'INFO':
        return { label: 'Info', color: 'bg-blue-600 text-white' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Journal d'Audit des Actions Sensibles (Audit Trail)</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full">
                  Direction & Gérance
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Traçabilité des changements de prix, remises &gt; 10%, suppressions et modifications de taux de change
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Filter by action */}
            <div>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
              >
                <option value="ALL">Toutes les actions sensibles</option>
                <option value="PRICE_CHANGE">Modifications de Prix</option>
                <option value="HIGH_DISCOUNT">Remises Exceptionnelles (&gt; 10%)</option>
                <option value="SALE_DELETE">Suppressions de Vente / Facture</option>
                <option value="EXCHANGE_RATE_CHANGE">Modifications du Taux BCC</option>
                <option value="STOCK_PURCHASE">Arrivages Fournisseurs</option>
                <option value="STOCK_ADJUSTMENT">Ajustements Manuels de Stock</option>
              </select>
            </div>

            {/* Filter by severity */}
            <div>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
              >
                <option value="ALL">Tous les niveaux de gravité</option>
                <option value="DANGER">Critique (DANGER)</option>
                <option value="WARNING">Avertissement (WARNING)</option>
                <option value="INFO">Information (INFO)</option>
              </select>
            </div>

            {/* Search input */}
            <div className="relative flex-1 min-w-[140px]">
              <input
                type="text"
                placeholder="Rechercher utilisateur, détail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Exporter tout le journal d'audit vers Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>

        {/* Audit Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <ShieldAlert className="w-10 h-10 mx-auto stroke-1 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-600">Aucun enregistrement d'audit trouvé</p>
              <p className="text-xs text-neutral-400">
                Toutes les opérations sensibles apparaîtront automatiquement ici.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const actionBadge = getActionBadge(log.action);
              const sevBadge = getSeverityBadge(log.severity);
              const ActionIcon = actionBadge.icon;

              return (
                <div
                  key={log.id}
                  className="p-3.5 bg-neutral-50 hover:bg-white rounded-xl border border-neutral-200/90 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sevBadge.color}`}>
                        {sevBadge.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${actionBadge.color}`}>
                        <ActionIcon className="w-3 h-3" />
                        <span>{actionBadge.label}</span>
                      </span>
                      <span className="font-bold text-neutral-900">{log.title}</span>
                    </div>
                    <p className="text-neutral-600 font-sans text-xs">{log.details}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200">
                    <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{log.userName}</span>
                      <span className="text-[10px] bg-neutral-200 px-1 rounded text-neutral-600 font-mono">
                        {log.userRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Total : {filteredLogs.length} action(s) tracée(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
