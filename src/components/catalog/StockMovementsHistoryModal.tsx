import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockMovement, StockMovementType, ProductOrService } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelUtils';
import {
  History,
  X,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Package,
  Layers,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';

interface StockMovementsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct?: ProductOrService | null;
}

export const StockMovementsHistoryModal: React.FC<StockMovementsHistoryModalProps> = ({
  isOpen,
  onClose,
  targetProduct,
}) => {
  const { stockMovements, products } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    targetProduct?.id || 'ALL'
  );
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update selected product when targetProduct prop changes
  React.useEffect(() => {
    if (targetProduct) {
      setSelectedProductId(targetProduct.id);
    } else {
      setSelectedProductId('ALL');
    }
  }, [targetProduct, isOpen]);

  const filteredMovements = useMemo(() => {
    if (!isOpen) return [];
    return stockMovements.filter((mov) => {
      // Product filter
      if (selectedProductId !== 'ALL' && mov.productId !== selectedProductId) {
        return false;
      }

      // Movement type filter
      if (selectedType !== 'ALL' && mov.type !== selectedType) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          mov.productName.toLowerCase().includes(q) ||
          mov.productCode.toLowerCase().includes(q) ||
          (mov.referenceDoc && mov.referenceDoc.toLowerCase().includes(q)) ||
          mov.operatorName.toLowerCase().includes(q) ||
          (mov.notes && mov.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [isOpen, stockMovements, selectedProductId, selectedType, searchQuery]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    const data = filteredMovements.map((m) => ({
      Date: m.date,
      Article: m.productName,
      CodeSKU: m.productCode,
      TypeMouvement: m.type,
      Variation: m.quantityChange > 0 ? `+${m.quantityChange}` : `${m.quantityChange}`,
      StockPrecedent: m.previousStock,
      NouveauStock: m.newStock,
      CoutUnitaireUSD: m.unitCostUSD || 0,
      ReferenceDoc: m.referenceDoc || 'N/A',
      Operateur: m.operatorName,
      Notes: m.notes || '',
    }));

    exportToExcel(`Journal_Mouvements_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { sheetName: 'Traçabilité_Mouvements', data },
    ]);
  };

  const getMovementTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case 'PURCHASE':
        return {
          label: 'Arrivage Fournisseur',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: ArrowDownLeft,
        };
      case 'SALE':
        return {
          label: 'Vente POS / Facture',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: ArrowUpRight,
        };
      case 'ADJUSTMENT':
        return {
          label: 'Ajustement / Casse',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: History,
        };
      case 'RETURN':
        return {
          label: 'Retour Marchandise',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: ArrowDownLeft,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                {targetProduct ? `Traçabilité & Fiche Article : ${targetProduct.name}` : 'Journal Général des Mouvements de Stock'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                Historique chronologique des entrées, sorties de caisse et ajustements d'inventaire
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
            {/* Filter by product */}
            <div className="w-56">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
              >
                <option value="ALL">Tous les articles ({products.filter(p => p.type === 'PRODUCT').length})</option>
                {products
                  .filter((p) => p.type === 'PRODUCT')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
              </select>
            </div>

            {/* Filter by movement type */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
              >
                <option value="ALL">Tous les types de flux</option>
                <option value="PURCHASE">Entrées / Arrivages Fournisseurs</option>
                <option value="SALE">Sorties / Ventes POS</option>
                <option value="ADJUSTMENT">Ajustements manuels & Inventaires</option>
                <option value="RETURN">Retours clients</option>
              </select>
            </div>

            {/* Search text */}
            <div className="relative flex-1 min-w-[140px]">
              <input
                type="text"
                placeholder="Rechercher BL, vente, opérateur..."
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
            title="Exporter tout le journal vers un fichier Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>

        {/* Movements Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMovements.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <History className="w-10 h-10 mx-auto stroke-1 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-600">Aucun mouvement de stock trouvé</p>
              <p className="text-xs text-neutral-400">
                Les entrées fournisseurs, ventes et ajustements apparaîtront automatiquement ici.
              </p>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 text-neutral-600 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Date & Heure</th>
                    <th className="py-2.5 px-3">Article & SKU</th>
                    <th className="py-2.5 px-3">Nature du Mouvement</th>
                    <th className="py-2.5 px-3 text-center">Variation</th>
                    <th className="py-2.5 px-3 text-right">Stock Résultant</th>
                    <th className="py-2.5 px-3">Réf Document</th>
                    <th className="py-2.5 px-3">Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono-nums">
                  {filteredMovements.map((mov) => {
                    const badge = getMovementTypeBadge(mov.type);
                    const isPositive = mov.quantityChange > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                          {formatDateTime(mov.date)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-bold text-neutral-900 block truncate max-w-[200px]">
                            {mov.productName}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {mov.productCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}
                          >
                            <badge.icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-md ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPositive ? `+${mov.quantityChange}` : mov.quantityChange}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                          {mov.newStock}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">
                          {mov.referenceDoc || (
                            <span className="text-neutral-400 italic font-sans text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-700 font-sans text-[11px]">
                          {mov.operatorName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Total : {filteredMovements.length} mouvement(s) tracé(s)</span>
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
