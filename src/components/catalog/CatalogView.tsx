import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductOrService, ItemType } from '../../types';
import { formatDualCurrency } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelUtils';
import { ItemModal } from './ItemModal';
import { StockReportModal } from './StockReportModal';
import { StockPurchaseModal } from './StockPurchaseModal';
import { StockMovementsHistoryModal } from './StockMovementsHistoryModal';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  Search,
  Plus,
  Package,
  Wrench,
  Edit2,
  Trash2,
  Upload,
  AlertTriangle,
  ArrowUpDown,
  Check,
  TrendingUp,
  Printer,
  FileSpreadsheet,
  Truck,
  History,
  LayoutGrid,
  List,
  DollarSign,
  Boxes,
  ShieldAlert,
  Percent,
} from 'lucide-react';

export const CatalogView: React.FC = () => {
  const { products, deleteProductOrService, adjustStock, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  // View & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubTab, setSelectedSubTab] = useState<'ALL' | 'PRODUCT' | 'SERVICE' | 'ALERTS'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name-asc' | 'stock-asc' | 'stock-desc' | 'price-desc' | 'price-asc' | 'value-desc'>('name-asc');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockReportModalOpen, setIsStockReportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [targetMovementProduct, setTargetMovementProduct] = useState<ProductOrService | null>(null);
  const [itemToEdit, setItemToEdit] = useState<ProductOrService | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductOrService | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<ItemType>('PRODUCT');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Comprehensive Stock Financial Metrics
  const stockMetrics = useMemo(() => {
    const productItems = products.filter((p) => p.type === 'PRODUCT');
    const serviceItems = products.filter((p) => p.type === 'SERVICE');

    const totalStockQty = productItems.reduce((acc, p) => acc + (p.stockQty || 0), 0);
    const totalCostValueUSD = productItems.reduce((acc, p) => acc + (p.stockQty || 0) * (p.costPriceUSD || 0), 0);
    const totalSaleValueUSD = productItems.reduce((acc, p) => acc + (p.stockQty || 0) * (p.priceUSD || 0), 0);
    const totalPotentialProfitUSD = Math.max(0, totalSaleValueUSD - totalCostValueUSD);

    const outOfStockCount = productItems.filter((p) => p.stockQty === 0).length;
    const lowStockCount = productItems.filter((p) => p.stockQty > 0 && p.stockQty <= (p.minStockAlert || 5)).length;

    return {
      productCount: productItems.length,
      serviceCount: serviceItems.length,
      totalCount: products.length,
      totalStockQty,
      totalCostValueUSD,
      totalSaleValueUSD,
      totalPotentialProfitUSD,
      outOfStockCount,
      lowStockCount,
      alertsCount: outOfStockCount + lowStockCount,
    };
  }, [products]);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    const result = products.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.barcode && item.barcode.includes(searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchSubTab = true;
      if (selectedSubTab === 'PRODUCT') matchSubTab = item.type === 'PRODUCT';
      else if (selectedSubTab === 'SERVICE') matchSubTab = item.type === 'SERVICE';
      else if (selectedSubTab === 'ALERTS') {
        matchSubTab = item.type === 'PRODUCT' && item.stockQty <= (item.minStockAlert || 5);
      }

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

      return matchSearch && matchSubTab && matchCategory;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'stock-asc') return (a.stockQty || 0) - (b.stockQty || 0);
      if (sortBy === 'stock-desc') return (b.stockQty || 0) - (a.stockQty || 0);
      if (sortBy === 'price-desc') return b.priceUSD - a.priceUSD;
      if (sortBy === 'price-asc') return a.priceUSD - b.priceUSD;
      if (sortBy === 'value-desc') {
        const valA = (a.stockQty || 0) * (a.costPriceUSD || 0);
        const valB = (b.stockQty || 0) * (b.costPriceUSD || 0);
        return valB - valA;
      }
      return 0;
    });
  }, [products, searchQuery, selectedSubTab, selectedCategory, sortBy]);

  const handleExportExcel = () => {
    const data = filteredItems.map((p) => ({
      Reference: p.code,
      Designation: p.name,
      Type: p.type === 'PRODUCT' ? 'Marchandise en stock' : 'Prestation de service',
      Categorie: p.category,
      Unite: p.unit,
      PrixVenteUSD: p.priceUSD,
      PrixVenteCDF: Math.round(p.priceUSD * rate),
      PrixDemiGrosUSD: p.priceSemiWholesaleUSD || '',
      PrixGrossisteUSD: p.priceWholesaleUSD || '',
      CoutAchatCMUP_USD: p.costPriceUSD,
      StockActuel: p.type === 'PRODUCT' ? p.stockQty : 'N/A (Service)',
      SeuilAlerte: p.type === 'PRODUCT' ? p.minStockAlert : 'N/A',
      ValeurStockCoutUSD: p.type === 'PRODUCT' ? (p.stockQty * p.costPriceUSD).toFixed(2) : '—',
      ValeurStockVenteUSD: p.type === 'PRODUCT' ? (p.stockQty * p.priceUSD).toFixed(2) : '—',
      GroupeTVA: p.taxGroup,
      CodeBarres: p.barcode || '',
      Description: p.description || '',
    }));
    exportToExcel(`CongoBiz_Catalogue_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      { sheetName: 'Catalogue_Stock', data },
    ]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions Toolbar */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Catalogue & Gestion des Stocks
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Inventaire des marchandises, tarification multi-niveaux, valorisation au CMUP et réapprovisionnements.
          </p>
        </div>

        {/* Action Buttons on single line under the title */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* New Supplier Purchase Arrivage (CMUP) */}
          <button
            type="button"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="h-8 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
            title="Enregistrer un arrivage fournisseur avec calcul automatique du CMUP / PUMP"
          >
            <Truck className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Arrivage Fournisseur (CMUP)</span>
          </button>

          {/* Traceability / Movement History */}
          <button
            type="button"
            onClick={() => {
              setTargetMovementProduct(null);
              setIsMovementsModalOpen(true);
            }}
            className="h-8 px-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
            title="Consulter le journal complet des mouvements de stock et traçabilité"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>Traçabilité des Flux</span>
          </button>

          {/* PDF Stock Report Button */}
          <button
            type="button"
            onClick={() => setIsStockReportModalOpen(true)}
            className="h-8 px-3 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
            title="Générer et télécharger l'état officiel des stocks en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-300" />
            <span>État Stock (PDF)</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-8 px-3 bg-white hover:bg-emerald-50 border border-neutral-300 hover:border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
            title="Exporter tout le catalogue vers un fichier Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Excel Import Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-8 px-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
            title="Importer des articles ou services depuis un fichier Excel (.xlsx, .xls)"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-600" />
            <span>Importer Excel</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setItemToEdit(null);
              setModalDefaultType('PRODUCT');
              setIsModalOpen(true);
            }}
            className="h-8 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Produit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setItemToEdit(null);
              setModalDefaultType('SERVICE');
              setIsModalOpen(true);
            }}
            className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Service</span>
          </button>
        </div>
      </div>

      {/* 2. Harmonized KPI Metric Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total References */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalogue & Références</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-neutral-900">
            {stockMetrics.totalCount} articles
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-sans">
            {stockMetrics.productCount} marchandise{stockMetrics.productCount > 1 ? 's' : ''} · {stockMetrics.serviceCount} service{stockMetrics.serviceCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Stock Value (Cost / CMUP) */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Valeur Stock (CMUP)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-emerald-700">
            ${stockMetrics.totalCostValueUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-mono-nums">
            {Math.round(stockMetrics.totalCostValueUSD * rate).toLocaleString('fr-FR')} FC (Coût de revient)
          </p>
        </div>

        {/* Stock Value (Sale Price) */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Valeur Réalisable (Vente)</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-neutral-900">
            ${stockMetrics.totalSaleValueUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-mono-nums">
            +${stockMetrics.totalPotentialProfitUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} marge théorique
          </p>
        </div>

        {/* Stock Alerts & Inventory status */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Unités & Alertes Stock</span>
            <ShieldAlert className={`w-4 h-4 ${stockMetrics.alertsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-neutral-900 flex items-center gap-2">
            <span>{stockMetrics.totalStockQty.toLocaleString('fr-FR')}</span>
            <span className="text-xs font-sans font-medium text-neutral-500">unités</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-sans">
            {stockMetrics.alertsCount > 0 ? (
              <span className="text-rose-600 font-semibold">
                {stockMetrics.outOfStockCount} rupture{stockMetrics.outOfStockCount > 1 ? 's' : ''} · {stockMetrics.lowStockCount} stock critique
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">Niveaux de stock nominaux</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. Navigation Subtabs, Search & View Controls */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Subtabs Segmented Controls */}
          <div className="flex bg-neutral-100 p-1 rounded-xl text-xs w-full lg:w-auto overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSubTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                selectedSubTab === 'ALL'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              Tous ({stockMetrics.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubTab('PRODUCT')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedSubTab === 'PRODUCT'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Marchandises ({stockMetrics.productCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubTab('SERVICE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedSubTab === 'SERVICE'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span>Services ({stockMetrics.serviceCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubTab('ALERTS')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedSubTab === 'ALERTS'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Alertes & Ruptures ({stockMetrics.alertsCount})</span>
            </button>
          </div>

          {/* Search, Sort & View Mode Switcher */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Search bar */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Rechercher nom, code, EAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-lg px-2 py-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-neutral-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="name-asc">Nom (A-Z)</option>
                <option value="stock-asc">Stock critique d'abord</option>
                <option value="stock-desc">Stock plus élevé</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="price-asc">Prix croissant</option>
                <option value="value-desc">Valeur stock plus forte</option>
              </select>
            </div>

            {/* View Mode Switcher: Table vs Grid */}
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="Affichage en liste détaillée (Tableau)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="Affichage en grille visuelle (Cartes)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Segmented Scroll */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-neutral-100 text-xs no-scrollbar">
            <span className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1">
              Catégorie :
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs transition-colors shrink-0 cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-neutral-900 text-white font-bold shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200/80'
              }`}
            >
              Toutes les catégories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white font-bold shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Display Content: Table View vs Grid Cards View */}
      {viewMode === 'table' ? (
        /* ======================================================== */
        /* MODE TABLEAU LISTE HARMONISÉ                             */
        /* ======================================================== */
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50 text-neutral-700 uppercase font-semibold text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Article & Référence</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Niveau de Stock & Ajusteur</th>
                  <th className="py-3 px-4 text-right">Prix de Vente</th>
                  <th className="py-3 px-4 text-right">Coût Achat CMUP</th>
                  <th className="py-3 px-4 text-right">Valeur Stock Ligne</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono-nums">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-neutral-400 font-sans text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Package className="w-8 h-8 text-neutral-300 stroke-1" />
                        <p className="font-semibold text-neutral-700">Aucun article ne correspond à votre filtre</p>
                        <p className="text-neutral-400 text-[11px]">Modifiez votre recherche ou ajoutez un nouveau produit/service.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const dualPrice = formatDualCurrency(item.priceUSD, rate);
                    const isOutOfStock = item.type === 'PRODUCT' && item.stockQty === 0;
                    const isLowStock =
                      item.type === 'PRODUCT' && item.stockQty <= (item.minStockAlert || 5) && !isOutOfStock;
                    
                    const lineValueUSD = item.type === 'PRODUCT' ? (item.stockQty || 0) * (item.costPriceUSD || 0) : 0;
                    const unitProfitUSD = Math.max(0, item.priceUSD - (item.costPriceUSD || 0));
                    const marginPercent = item.priceUSD > 0 ? Math.round((unitProfitUSD / item.priceUSD) * 100) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                        {/* Article & Ref */}
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 font-black text-xs shrink-0 border border-neutral-200 overflow-hidden">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover object-center"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : item.type === 'PRODUCT' ? (
                                <Package className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Wrench className="w-4 h-4 text-amber-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-neutral-900 block truncate max-w-xs">{item.name}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono-nums mt-0.5">
                                <span className="font-semibold text-neutral-700">Réf: {item.code}</span>
                                {item.barcode && <span className="text-blue-700">· EAN: {item.barcode}</span>}
                                {item.category && <span className="text-neutral-400">· {item.category}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 text-center font-sans">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              item.type === 'PRODUCT'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.type === 'PRODUCT' ? 'Marchandise' : 'Service'}
                          </span>
                        </td>

                        {/* Stock & Quick Adjuster */}
                        <td className="py-3 px-4 text-center">
                          {item.type === 'PRODUCT' ? (
                            <div className="flex flex-col items-center gap-1">
                              {/* Stock status indicator */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-sans ${
                                  isOutOfStock
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isOutOfStock ? 'Rupture' : isLowStock ? `Stock Critique (${item.stockQty}/${item.minStockAlert})` : `En Stock (${item.stockQty} ${item.unit})`}
                              </span>

                              {/* Quick stock adjustment buttons */}
                              <div className="flex items-center justify-center gap-1 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => adjustStock(item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-bold transition-colors cursor-pointer"
                                  title="-1 unité"
                                >
                                  -
                                </button>
                                <span className="font-mono-nums font-extrabold px-1 text-xs text-neutral-900">
                                  {item.stockQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => adjustStock(item.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-bold transition-colors cursor-pointer"
                                  title="+1 unité"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => adjustStock(item.id, 5)}
                                  className="px-1.5 py-0.5 bg-neutral-200/80 hover:bg-neutral-300 text-neutral-800 rounded text-[10px] font-mono-nums font-bold transition-colors cursor-pointer"
                                  title="+5 unités"
                                >
                                  +5
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 font-medium font-sans">
                              Prestation illimitée ({item.unit})
                            </span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-neutral-900 text-xs">
                            <span>${item.priceUSD.toFixed(2)}</span>
                            <span className="block text-[10px] font-normal text-neutral-500 font-mono-nums">
                              {dualPrice.cdf}
                            </span>
                            {(item.priceSemiWholesaleUSD || item.priceWholesaleUSD) && (
                              <div className="text-[9px] text-neutral-400 font-sans mt-0.5 flex items-center justify-end gap-1">
                                {item.priceSemiWholesaleUSD && <span>½G: ${item.priceSemiWholesaleUSD}</span>}
                                {item.priceWholesaleUSD && <span>· G: ${item.priceWholesaleUSD}</span>}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Cost Price CMUP */}
                        <td className="py-3 px-4 text-right text-neutral-600 font-medium">
                          {item.costPriceUSD ? (
                            <div>
                              <span>${item.costPriceUSD.toFixed(2)}</span>
                              <span className="block text-[10px] text-neutral-400 font-mono-nums">
                                {Math.round(item.costPriceUSD * rate).toLocaleString('fr-FR')} FC
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>

                        {/* Line Stock Value */}
                        <td className="py-3 px-4 text-right">
                          {item.type === 'PRODUCT' ? (
                            <div>
                              <span className="font-bold text-neutral-900 block text-xs">
                                ${lineValueUSD.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-sans font-semibold">
                                Marge: {marginPercent}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-sans">Forfait</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.type === 'PRODUCT' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetMovementProduct(item);
                                  setIsMovementsModalOpen(true);
                                }}
                                className="p-1.5 text-neutral-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Fiche article & Traçabilité des mouvements de stock"
                              >
                                <History className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setItemToEdit(item);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                              title="Modifier l'article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer définitivement"
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
      ) : (
        /* ======================================================== */
        /* MODE GRILLE VISUELLE (CARDS) HARMONISÉ                  */
        /* ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-400 bg-white rounded-xl border border-neutral-200">
              <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2 stroke-1" />
              <p className="font-semibold text-neutral-700 text-xs">Aucun article ne correspond à votre filtre</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const dualPrice = formatDualCurrency(item.priceUSD, rate);
              const isOutOfStock = item.type === 'PRODUCT' && item.stockQty === 0;
              const isLowStock =
                item.type === 'PRODUCT' && item.stockQty <= (item.minStockAlert || 5) && !isOutOfStock;
              const lineValueUSD = item.type === 'PRODUCT' ? (item.stockQty || 0) * (item.costPriceUSD || 0) : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Image Banner if available */}
                    {item.imageUrl && (
                      <div className="w-full h-28 mb-2.5 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-100 relative">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            (e.target as HTMLElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Header: Type & Stock Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                        {item.type === 'PRODUCT' ? (
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{item.type === 'PRODUCT' ? 'Marchandise' : 'Service'}</span>
                      </span>

                      {item.type === 'PRODUCT' && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? 'Rupture' : isLowStock ? `Alerte (${item.stockQty})` : `Stock: ${item.stockQty}`}
                        </span>
                      )}
                    </div>

                    {/* Title & Category */}
                    <h3 className="font-bold text-xs text-neutral-900 line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1 font-mono-nums">
                      <span>Réf: {item.code}</span>
                      {item.category && <span>· {item.category}</span>}
                    </div>

                    {/* Stock level progress bar for products */}
                    {item.type === 'PRODUCT' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-neutral-500 font-mono-nums mb-1">
                          <span>Quantité : {item.stockQty} {item.unit}</span>
                          <span>Seuil min : {item.minStockAlert || 5}</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOutOfStock ? 'w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(10, (item.stockQty / Math.max(1, (item.minStockAlert || 5) * 3)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Stock Adjusters */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
                    <div className="flex items-center justify-between font-mono-nums">
                      <div>
                        <span className="text-sm font-black text-neutral-900 block leading-tight">
                          ${item.priceUSD.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          {dualPrice.cdf}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-neutral-500">
                        {item.costPriceUSD ? (
                          <span>Coût : ${item.costPriceUSD.toFixed(2)}</span>
                        ) : null}
                        {item.type === 'PRODUCT' && (
                          <span className="block font-semibold text-neutral-700">
                            Val: ${lineValueUSD.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Adjust Buttons & Actions */}
                    <div className="flex items-center justify-between pt-1">
                      {item.type === 'PRODUCT' ? (
                        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => adjustStock(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center bg-white hover:bg-neutral-200 text-neutral-800 rounded font-bold text-xs shadow-2xs cursor-pointer"
                            title="-1 unité"
                          >
                            -
                          </button>
                          <span className="px-1 text-xs font-mono-nums font-bold text-neutral-900">
                            {item.stockQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustStock(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center bg-white hover:bg-neutral-200 text-neutral-800 rounded font-bold text-xs shadow-2xs cursor-pointer"
                            title="+1 unité"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-sans">Prestation</span>
                      )}

                      <div className="flex items-center gap-1">
                        {item.type === 'PRODUCT' && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMovementProduct(item);
                              setIsMovementsModalOpen(true);
                            }}
                            className="p-1 text-neutral-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Historique de traçabilité"
                          >
                            <History className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setItemToEdit(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Modals Management */}
      {/* Modal Add/Edit Item */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
        defaultType={modalDefaultType}
      />

      {/* Modal Stock Report PDF */}
      <StockReportModal
        isOpen={isStockReportModalOpen}
        onClose={() => setIsStockReportModalOpen(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(itemToDelete)}
        title={`Supprimer ${itemToDelete?.type === 'SERVICE' ? 'le service' : "l'article"} ?`}
        message={`Êtes-vous sûr de vouloir supprimer définitivement "${itemToDelete?.name}" du catalogue ?`}
        details={itemToDelete ? `Code: ${itemToDelete.code} · Prix: $${itemToDelete.priceUSD.toFixed(2)} USD` : ''}
        confirmText="Supprimer"
        onConfirm={() => {
          if (itemToDelete) {
            deleteProductOrService(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Excel & CSV Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        moduleType="PRODUCTS"
        title="Importer Articles & Prestations de Services"
      />

      {/* Supplier Stock Purchase / CMUP Arrivage Modal */}
      <StockPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={() => {
          setIsPurchaseModalOpen(false);
        }}
      />

      {/* Stock Movements & Traceability Modal */}
      <StockMovementsHistoryModal
        isOpen={isMovementsModalOpen}
        onClose={() => {
          setIsMovementsModalOpen(false);
          setTargetMovementProduct(null);
        }}
        targetProduct={targetMovementProduct}
      />
    </div>
  );
};
