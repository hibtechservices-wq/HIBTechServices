import React, { useState } from 'react';
import { ProductOrService, Currency, Client } from '../../types';
import { formatDualCurrency } from '../../utils/formatters';
import { getEffectiveProductPrice } from './PortalCatalog';
import {
  X,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Wrench,
  ShieldCheck,
  Tag,
  Boxes,
  ShoppingCart,
  Building,
  Check,
} from 'lucide-react';

interface PortalProductModalProps {
  product: ProductOrService | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductOrService, quantity: number) => void;
  exchangeRate: number;
  currency?: Currency;
  portalClient?: Client | null;
}

export const PortalProductModal: React.FC<PortalProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  exchangeRate,
  currency = 'USD',
  portalClient,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const isProduct = product.type === 'PRODUCT';
  const effectivePrice = getEffectiveProductPrice(product, portalClient);
  const safePriceUSD = effectivePrice.priceUSD;
  const dualPrice = formatDualCurrency(safePriceUSD, exchangeRate);
  const isCurrencyCDF = currency === 'CDF';
  const isPriceZero = safePriceUSD <= 0;
  const maxStock = isProduct ? Math.max(0, product.stockQty) : 999;
  const isOutOfStock = isProduct && product.stockQty <= 0;
  const lineTotalUSD = safePriceUSD * quantity;
  const lineTotalDual = formatDualCurrency(lineTotalUSD, exchangeRate);

  const handleAdd = () => {
    const itemToAdd: ProductOrService = {
      ...product,
      priceUSD: safePriceUSD,
    };
    onAddToCart(itemToAdd, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isProduct
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              {isProduct ? <Package className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
              {isProduct ? 'Produit Matériel' : 'Prestation de Service'}
            </span>
            <span className="text-xs text-neutral-500 font-mono bg-neutral-200/70 px-2 py-0.5 rounded">
              Réf: {product.code}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-xl transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Visual & Key Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {/* Image Box */}
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center group">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder if broken url
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-neutral-400 flex flex-col items-center gap-2">
                  {isProduct ? <Package className="w-16 h-16 stroke-1 text-neutral-300" /> : <Wrench className="w-16 h-16 stroke-1 text-neutral-300" />}
                  <span className="text-xs">Photo non disponible</span>
                </div>
              )}

              {/* In stock badge */}
              <div className="absolute top-2.5 left-2.5">
                {isProduct ? (
                  product.stockQty > 0 ? (
                    <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      En Stock ({product.stockQty} {product.unit}s)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-lg shadow-xs">
                      Rupture de Stock
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-1 bg-teal-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Prestation Disponible
                  </span>
                )}
              </div>
            </div>

            {/* Price & Primary Specs */}
            <div className="space-y-4">
              <div>
                {product.brand && (
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Marque : <span className="text-neutral-800">{product.brand}</span>
                  </span>
                )}
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 leading-snug">
                  {product.name}
                </h3>
                <span className="inline-block mt-1 text-xs text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-md">
                  Catégorie : {product.category}
                </span>
              </div>

              {/* Tarification sur devis box */}
              <div className="p-3.5 bg-neutral-50/90 border border-neutral-200/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block">
                    Modalité Tarifaire
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    Devis Personnalisé
                  </span>
                </div>
                <div className="text-base font-bold text-neutral-900">
                  Tarification sur devis proforma
                </div>
                <p className="text-xs text-neutral-500">
                  Ajoutez cet article avec la quantité souhaitée à votre sélection pour recevoir votre offre de prix officielle.
                </p>
              </div>

              {/* Tax & Unit information */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-neutral-500 block text-[10px]">Régime TVA</span>
                  <span className="font-semibold text-neutral-800">
                    {product.taxGroup === 'A' ? 'Groupe A (16% TVA)' : 'Exonéré TVA'}
                  </span>
                </div>
                <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-neutral-500 block text-[10px]">Unité de mesure</span>
                  <span className="font-semibold text-neutral-800">{product.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          {product.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neutral-500" />
                Description & Caractéristiques Générales
              </h4>
              <p className="text-sm text-neutral-600 bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Technical Specs List */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Spécifications Techniques Incluses
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-neutral-200/80 text-xs text-neutral-700 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Quantity & Add to Cart */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Quantité :
            </span>
            <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                max={isProduct ? maxStock : 999}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(val, isProduct && maxStock > 0 ? maxStock : 999)));
                }}
                className="w-14 text-center font-bold text-sm text-neutral-900 py-1.5 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                disabled={isProduct && quantity >= maxStock}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-neutral-500 font-medium">
              Quantité : <strong className="text-neutral-800 font-mono-nums">{quantity}</strong> {product.unit}{quantity > 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition-colors"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : isOutOfStock
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md active:scale-98'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  Ajouté au Devis !
                </>
              ) : isOutOfStock ? (
                'Article Indisponible'
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Ajouter au Panier Proforma
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
