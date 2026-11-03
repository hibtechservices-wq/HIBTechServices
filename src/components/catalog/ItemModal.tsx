import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductOrService, ItemType, FiscalTaxGroup } from '../../types';
import { Package, Wrench, X, Check, DollarSign, ShieldCheck, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: ProductOrService | null;
  defaultType?: ItemType;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  defaultType = 'PRODUCT',
}) => {
  const { addProductOrService, updateProductOrService, settings } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  const [type, setType] = useState<ItemType>(defaultType);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Matériel & Ventes');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Pièce');
  const [priceUSD, setPriceUSD] = useState<number>(0);
  const [priceSemiWholesaleUSD, setPriceSemiWholesaleUSD] = useState<number | undefined>(undefined);
  const [priceWholesaleUSD, setPriceWholesaleUSD] = useState<number | undefined>(undefined);
  const [costPriceUSD, setCostPriceUSD] = useState<number>(0);
  const [stockQty, setStockQty] = useState<number>(10);
  const [minStockAlert, setMinStockAlert] = useState<number>(3);
  const [taxGroup, setTaxGroup] = useState<FiscalTaxGroup>('A');
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (itemToEdit) {
      setType(itemToEdit.type);
      setName(itemToEdit.name);
      setCode(itemToEdit.code);
      setBarcode(itemToEdit.barcode || '');
      setCategory(itemToEdit.category);
      setDescription(itemToEdit.description || '');
      setUnit(itemToEdit.unit);
      setPriceUSD(itemToEdit.priceUSD);
      setPriceSemiWholesaleUSD(itemToEdit.priceSemiWholesaleUSD);
      setPriceWholesaleUSD(itemToEdit.priceWholesaleUSD);
      setCostPriceUSD(itemToEdit.costPriceUSD);
      setStockQty(itemToEdit.stockQty);
      setMinStockAlert(itemToEdit.minStockAlert);
      setTaxGroup(itemToEdit.taxGroup || 'A');
      setImageUrl(itemToEdit.imageUrl || '');
    } else {
      setType(defaultType);
      setName('');
      setCode(`ART-${Date.now().toString().slice(-4)}`);
      setBarcode('');
      setCategory(defaultType === 'PRODUCT' ? 'Informatique & Ordinateurs' : 'Support & Maintenance');
      setDescription('');
      setUnit(defaultType === 'PRODUCT' ? 'Pièce' : 'Forfait');
      setPriceUSD(50);
      setPriceSemiWholesaleUSD(45);
      setPriceWholesaleUSD(40);
      setCostPriceUSD(35);
      setStockQty(10);
      setMinStockAlert(3);
      setTaxGroup('A');
      setImageUrl('');
    }
  }, [itemToEdit, defaultType, isOpen]);

  const handleImageFileChange = (file?: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("L'image est trop volumineuse (maximum 4 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (itemToEdit) {
      updateProductOrService(itemToEdit.id, {
        name,
        code,
        barcode: barcode.trim() || undefined,
        type,
        category,
        description: description.trim() || undefined,
        unit,
        priceUSD,
        priceSemiWholesaleUSD: priceSemiWholesaleUSD !== undefined ? Number(priceSemiWholesaleUSD) : undefined,
        priceWholesaleUSD: priceWholesaleUSD !== undefined ? Number(priceWholesaleUSD) : undefined,
        costPriceUSD,
        stockQty: type === 'PRODUCT' ? stockQty : 0,
        minStockAlert: type === 'PRODUCT' ? minStockAlert : 0,
        taxGroup,
        imageUrl: imageUrl.trim() || undefined,
      });
    } else {
      addProductOrService({
        name,
        code,
        barcode: barcode.trim() || undefined,
        type,
        category,
        description: description.trim() || undefined,
        unit,
        priceUSD,
        priceSemiWholesaleUSD: priceSemiWholesaleUSD !== undefined ? Number(priceSemiWholesaleUSD) : undefined,
        priceWholesaleUSD: priceWholesaleUSD !== undefined ? Number(priceWholesaleUSD) : undefined,
        costPriceUSD,
        stockQty: type === 'PRODUCT' ? stockQty : 0,
        minStockAlert: type === 'PRODUCT' ? minStockAlert : 0,
        taxGroup,
        imageUrl: imageUrl.trim() || undefined,
        isActive: true,
      });
    }

    onClose();
  };

  const productUnits = ['Pièce', 'Carton', 'Lot', 'Bobine', 'Mètre', 'Pack', 'Boîte', 'Unité', 'Kg'];
  const serviceUnits = ['Forfait', 'Heure', 'Jour / Homme', 'Mois', 'Point réseau', 'Machine', 'Projet', 'Séance'];

  const productCategories = [
    'Informatique & Ordinateurs',
    'Énergie & Onduleurs',
    'Réseaux & Télécoms',
    'Matériel de Bureau',
    'Sécurité Électronique',
    'Fournitures de Bureau',
    'Quincaillerie & Électrique',
    'Téléphonie & Accessoires',
    'Autre Produit',
  ];

  const serviceCategories = [
    'Prestations Réseau',
    'Sécurité Électronique',
    'Support & Maintenance',
    'Conseil & Audit',
    'Développement & Logiciels',
    'Installation & Câblage',
    'Nettoyage & Entretien',
    'Autre Prestation',
  ];

  const marginUSD = priceUSD - costPriceUSD;
  const marginPercent = priceUSD > 0 ? Math.round((marginUSD / priceUSD) * 100) : 0;
  const priceCDF = Math.round(priceUSD * rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center">
              {type === 'PRODUCT' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">
                {itemToEdit
                  ? `Modifier ${type === 'PRODUCT' ? "l'Article" : 'la Prestation'}`
                  : `Ajouter ${type === 'PRODUCT' ? 'un Produit en Vente' : 'une Prestation de Service'}`}
              </h3>
              <p className="text-xs text-neutral-500">
                {type === 'PRODUCT' ? 'Gestion des stocks et prix de vente' : 'Tarification forfaitaire, horaire ou par projet'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Nature de l'Élément
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('PRODUCT');
                  setUnit('Pièce');
                  setCategory(productCategories[0]);
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  type === 'PRODUCT'
                    ? 'border-amber-600 bg-amber-50 text-neutral-900 font-semibold ring-1 ring-amber-600'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Package className="w-4 h-4 text-amber-600" />
                <span>Produit Physique (Avec Stock)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('SERVICE');
                  setUnit('Forfait');
                  setCategory(serviceCategories[0]);
                }}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  type === 'SERVICE'
                    ? 'border-amber-600 bg-amber-50 text-neutral-900 font-semibold ring-1 ring-amber-600'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Prestation de Service (Sans Stock)</span>
              </button>
            </div>
          </div>

          {/* Name, Reference & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Désignation {type === 'PRODUCT' ? 'du Produit' : 'du Service'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'PRODUCT' ? 'Ex: Onduleur APC 1100VA' : 'Ex: Installation caméras surveillance'}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Code / Réf SKU *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: APC-1100"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white font-mono-nums"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Code-barres EAN
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ex: 6941234567891"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white font-mono-nums"
              />
            </div>
          </div>

          {/* Category, Unit & DGI Fiscal Tax Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
              >
                {(type === 'PRODUCT' ? productCategories : serviceCategories).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Unité de Facturation
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
              >
                {(type === 'PRODUCT' ? productUnits : serviceUnits).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Groupe Fiscal DGI (TVA)
              </label>
              <select
                value={taxGroup}
                onChange={(e) => setTaxGroup(e.target.value as FiscalTaxGroup)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white font-semibold"
              >
                <option value="A">Groupe A (16% TVA Standard)</option>
                <option value="B">Groupe B (0% Taux Réduit)</option>
                <option value="C">Groupe C (Exonéré DGI)</option>
                <option value="D">Groupe D (Hors champ TVA)</option>
              </select>
            </div>
          </div>

          {/* Prices & Profit Margin */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Prix de Vente Hors Taxe ($ USD) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(Number(e.target.value))}
                    className="w-full font-mono-nums font-bold text-base bg-white border border-neutral-300 rounded-lg pl-8 pr-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                    required
                  />
                  <DollarSign className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[11px] font-mono-nums text-neutral-500 mt-1 block">
                  ≈ {priceCDF.toLocaleString('fr-FR')} FC (Taux 1$={rate} FC)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Coût de Revient / Achat ($ USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={costPriceUSD}
                    onChange={(e) => setCostPriceUSD(Number(e.target.value))}
                    className="w-full font-mono-nums bg-white border border-neutral-300 rounded-lg pl-8 pr-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <DollarSign className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[11px] font-mono-nums text-emerald-700 font-medium mt-1 block">
                  Marge brute détail : +${marginUSD.toFixed(2)} ({marginPercent}%)
                </span>
              </div>
            </div>

            {/* Grilles Tarifaires Additionnelles (Demi-Gros & Grossiste) */}
            <div className="pt-2 border-t border-neutral-200">
              <label className="block text-[11px] font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Grilles Tarifaires Multiples (Optionnel)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-neutral-600 uppercase mb-1">
                    Prix Demi-Gros ($ USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={priceSemiWholesaleUSD ?? ''}
                      placeholder={priceUSD ? `${(priceUSD * 0.9).toFixed(1)}` : '0'}
                      onChange={(e) => setPriceSemiWholesaleUSD(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full font-mono-nums font-semibold bg-white border border-neutral-300 rounded-lg pl-7 pr-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <DollarSign className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    Clients réguliers ou achats par volume
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-neutral-600 uppercase mb-1">
                    Prix Grossiste ($ USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={priceWholesaleUSD ?? ''}
                      placeholder={priceUSD ? `${(priceUSD * 0.8).toFixed(1)}` : '0'}
                      onChange={(e) => setPriceWholesaleUSD(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full font-mono-nums font-semibold bg-white border border-neutral-300 rounded-lg pl-7 pr-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <DollarSign className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    Revendeurs, entreprises sous contrat SLA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock fields (Only for Products) */}
          {type === 'PRODUCT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Quantité en Stock Actuel
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full font-mono-nums bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Seuil d'Alerte Rupture Stock
                </label>
                <input
                  type="number"
                  min="1"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Number(e.target.value))}
                  className="w-full font-mono-nums bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Photo du Produit / Service (Pour Espace Client B2B & Catalogue) */}
          <div className="p-3.5 bg-neutral-50/80 rounded-xl border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Photo du Produit (Affichée dans l'Espace Client & POS)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer la photo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              {/* Preview Thumbnail */}
              <div className="sm:col-span-1 h-24 rounded-lg border-2 border-dashed border-neutral-300 bg-white flex items-center justify-center overflow-hidden relative group">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Aperçu du produit"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLElement).style.opacity = '0.3';
                    }}
                  />
                ) : (
                  <div className="text-neutral-400 flex flex-col items-center gap-1">
                    <ImageIcon className="w-6 h-6 stroke-1 text-neutral-300" />
                    <span className="text-[10px] text-neutral-400 font-medium">Aucune photo</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="sm:col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="h-8 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Choisir une photo locale (PNG/JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileChange(e.target.files?.[0])}
                    />
                  </label>
                  <span className="text-[10px] text-neutral-400 font-medium">Max 4 Mo</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Ou collez un lien d'image web (https://...)"
                    className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  Cette image sera visible par vos clients sur le <strong>Portail Client B2B</strong> et lors de leurs demandes de devis proforma en ligne.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Description / Spécifications techniques
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Garantie 1 an, livré avec accessoires, compatible tous réseaux..."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs font-bold"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>{itemToEdit ? 'Mettre à jour' : 'Enregistrer dans le Catalogue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
