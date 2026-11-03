import React, { useState, useMemo } from 'react';
import { ProductOrService, Currency, Client } from '../../types';
import { formatDualCurrency } from '../../utils/formatters';
import { PortalProductModal } from './PortalProductModal';
import {
  Search,
  Filter,
  Package,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Minus,
  ShoppingCart,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowUpDown,
  Tag,
  Check,
} from 'lucide-react';

export interface EffectivePriceResult {
  priceUSD: number;
  tierLabel: string | null;
  isDiscounted: boolean;
  originalPriceUSD: number;
}

export const getEffectiveProductPrice = (product: ProductOrService, client?: Client | null): EffectivePriceResult => {
  const safeBasePrice = typeof product.priceUSD === 'number' && !isNaN(product.priceUSD) ? product.priceUSD : Number(product.priceUSD) || 0;

  if (client?.pricingTier === 'WHOLESALE' && product.priceWholesaleUSD !== undefined && product.priceWholesaleUSD > 0) {
    return {
      priceUSD: Number(product.priceWholesaleUSD),
      tierLabel: 'Tarif Grossiste B2B',
      isDiscounted: true,
      originalPriceUSD: safeBasePrice,
    };
  }
  if (client?.pricingTier === 'SEMI_WHOLESALE' && product.priceSemiWholesaleUSD !== undefined && product.priceSemiWholesaleUSD > 0) {
    return {
      priceUSD: Number(product.priceSemiWholesaleUSD),
      tierLabel: 'Tarif Demi-Gros',
      isDiscounted: true,
      originalPriceUSD: safeBasePrice,
    };
  }
  return {
    priceUSD: safeBasePrice,
    tierLabel: null,
    isDiscounted: false,
    originalPriceUSD: safeBasePrice,
  };
};

interface PortalCatalogProps {
  products: ProductOrService[];
  exchangeRate: number;
  currency?: Currency;
  portalClient?: Client | null;
  onAddToCart: (product: ProductOrService, quantity: number) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const PortalCatalog: React.FC<PortalCatalogProps> = ({
  products,
  exchangeRate,
  currency = 'USD',
  portalClient,
  onAddToCart,
  cartCount,
  onOpenCart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME'>('POPULAR');
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductOrService | null>(null);

  // Added animation state for individual cards
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.isActive);

    // Type filter
    if (typeFilter !== 'ALL') {
      result = result.filter((p) => p.type === typeFilter);
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // In stock filter (applies only to products, services are always available)
    if (inStockOnly) {
      result = result.filter((p) => p.type === 'SERVICE' || p.stockQty > 0);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      const priceA = getEffectiveProductPrice(a, portalClient).priceUSD;
      const priceB = getEffectiveProductPrice(b, portalClient).priceUSD;
      switch (sortBy) {
        case 'PRICE_ASC':
          return priceA - priceB;
        case 'PRICE_DESC':
          return priceB - priceA;
        case 'NAME':
          return a.name.localeCompare(b.name);
        case 'POPULAR':
        default:
          return (b.stockQty || 0) - (a.stockQty || 0);
      }
    });
  }, [products, typeFilter, selectedCategory, inStockOnly, searchTerm, sortBy, portalClient]);

  const handleQuickAdd = (product: ProductOrService, e: React.MouseEvent) => {
    e.stopPropagation();
    const effective = getEffectiveProductPrice(product, portalClient);
    const itemToAdd: ProductOrService = {
      ...product,
      priceUSD: effective.priceUSD,
    };
    onAddToCart(itemToAdd, 1);
    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 750);
  };

  const productCount = products.filter((p) => p.type === 'PRODUCT').length;
  const serviceCount = products.filter((p) => p.type === 'SERVICE').length;

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200/80 space-y-4">
        {/* Search input & Quick Cart info */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit, une prestation, une marque (ex: HP, Starlink, Câblage, Onduleur)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 bg-neutral-200 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Selector */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-8 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="POPULAR">Disponibilité / Pertinence</option>
                <option value="NAME">Nom alphabétique (A-Z)</option>
              </select>
            </div>

            {/* In stock toggle */}
            <label className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-700 font-medium cursor-pointer select-none hover:bg-neutral-100 transition-colors">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
              />
              <span className="hidden sm:inline">En stock uniquement</span>
              <span className="sm:hidden">En stock</span>
            </label>
          </div>
        </div>

        {/* Type Tabs: All / Products / Services */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100/90 rounded-xl border border-neutral-200/70 text-xs">
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setSelectedCategory('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                typeFilter === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tout le Catalogue</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700 font-mono-nums">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => {
                setTypeFilter('PRODUCT');
                setSelectedCategory('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                typeFilter === 'PRODUCT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Matériels & Équipements</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-nums ${
                typeFilter === 'PRODUCT' ? 'bg-blue-700 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {productCount}
              </span>
            </button>

            <button
              onClick={() => {
                setTypeFilter('SERVICE');
                setSelectedCategory('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                typeFilter === 'SERVICE'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Prestations & Services</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-nums ${
                typeFilter === 'SERVICE' ? 'bg-purple-700 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {serviceCount}
              </span>
            </button>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Affichage de <span className="font-bold text-neutral-900">{filteredProducts.length}</span> article(s)
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-neutral-900 text-white font-semibold'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            Toutes Catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-neutral-300 space-y-3">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">Aucun produit ou prestation trouvée</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Aucun article ne correspond à votre recherche « {searchTerm} ». Modifiez vos filtres ou réinitialisez la recherche.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('ALL');
              setSelectedCategory('ALL');
              setInStockOnly(false);
            }}
            className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product) => {
            const isProduct = product.type === 'PRODUCT';
            const effectivePrice = getEffectiveProductPrice(product, portalClient);
            const safePriceUSD = effectivePrice.priceUSD;
            const dualPrice = formatDualCurrency(safePriceUSD, exchangeRate);
            const isOutOfStock = isProduct && product.stockQty <= 0;
            const isAdded = addedAnimationId === product.id;
            const isPriceZero = safePriceUSD <= 0;
            const isCurrencyCDF = currency === 'CDF';

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProductForModal(product)}
                className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer hover:border-emerald-300"
              >
                {/* Image Showcase */}
                <div className="relative aspect-16/10 bg-neutral-100 overflow-hidden border-b border-neutral-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 bg-neutral-50">
                      {isProduct ? <Package className="w-12 h-12 stroke-1" /> : <Wrench className="w-12 h-12 stroke-1" />}
                      <span className="text-[10px] text-neutral-400 mt-1 font-mono">Image indisponible</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs backdrop-blur-xs flex items-center gap-1 ${
                        isProduct
                          ? 'bg-blue-600/90 text-white'
                          : 'bg-purple-600/90 text-white'
                      }`}
                    >
                      {isProduct ? <Package className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                      {isProduct ? 'Matériel' : 'Prestation'}
                    </span>

                    {/* Stock Status Badge */}
                    {isProduct ? (
                      product.stockQty > 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600/90 text-white shadow-xs backdrop-blur-xs">
                          {product.stockQty} en stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600/90 text-white shadow-xs backdrop-blur-xs">
                          Rupture
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600/90 text-white shadow-xs backdrop-blur-xs">
                        Disponible
                      </span>
                    )}
                  </div>

                  {/* Quick Preview Hover Overlay */}
                  <div className="absolute inset-0 bg-neutral-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 bg-white/95 text-neutral-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      Voir fiche complète
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Brand & Category */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                      <span className="truncate max-w-[130px] font-semibold text-neutral-700">
                        {product.brand || product.category}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">{product.code}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h3>

                    {/* Feature snippets */}
                    {product.features && product.features.length > 0 ? (
                      <div className="text-[11px] text-neutral-600 line-clamp-2 leading-tight space-y-0.5 pt-0.5">
                        <span className="inline-block text-emerald-600 font-bold mr-1">✓</span>
                        {product.features.slice(0, 2).join(' • ')}
                      </div>
                    ) : product.description ? (
                      <p className="text-[11px] text-neutral-500 line-clamp-2 leading-tight">
                        {product.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-neutral-100 space-y-2.5">
                    {/* Quotation & Unit Notice */}
                    <div className="flex items-center justify-between text-xs bg-neutral-50/90 px-3 py-1.5 rounded-xl border border-neutral-200/60">
                      <span className="font-semibold text-[11px] text-emerald-800 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>Disponible sur devis</span>
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500 uppercase bg-white px-2 py-0.5 rounded border border-neutral-200 font-semibold">
                        {product.unit}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForModal(product);
                        }}
                        className="px-2.5 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl text-xs font-semibold border border-neutral-200 transition-colors"
                        title="Détails techniques"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        disabled={isOutOfStock}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : isOutOfStock
                            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-sm active:scale-98'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Ajouté !
                          </>
                        ) : isOutOfStock ? (
                          'Rupture'
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Ajouter au Devis
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for product preview */}
      <PortalProductModal
        product={selectedProductForModal}
        isOpen={Boolean(selectedProductForModal)}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={onAddToCart}
        exchangeRate={exchangeRate}
        currency={currency}
        portalClient={portalClient}
      />
    </div>
  );
};
