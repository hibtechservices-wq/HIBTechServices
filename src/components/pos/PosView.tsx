import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductOrService, PaymentMethod } from '../../types';
import { formatMoney, formatDualCurrency, getPaymentMethodLabel } from '../../utils/formatters';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  User,
  Package,
  Wrench,
  DollarSign,
  Receipt,
  RotateCcw,
  ShieldCheck,
  BarChart2,
  ScanLine,
  Camera,
  FileText,
  Zap,
  UserPlus,
  Pause,
  Play,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Percent,
  Ban,
  Calculator,
  Coins,
  Printer,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PosSalesChart } from './PosSalesChart';
import { PosProformaModal } from './PosProformaModal';
import { PosBarcodeScannerModal } from './PosBarcodeScannerModal';
import { PosQuickClientModal } from './PosQuickClientModal';
import { PosDualCurrencyChangeModal } from './PosDualCurrencyChangeModal';
import { PosReprintModal } from './PosReprintModal';

export const PosView: React.FC = () => {
  const {
    products,
    clients,
    cart,
    posPricingTier,
    setPosPricingTier,
    addToCart,
    updateCartItemUnitPrice,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    createSale,
    settings,
    selectedCurrency,
    setActivePrintSale,
  } = useApp();

  const rate = settings.exchangeRateUSD_CDF || 2850;

  // Scanner & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [scanQuantity, setScanQuantity] = useState<number>(1);
  const [isScannerFocused, setIsScannerFocused] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scanNotification, setScanNotification] = useState<{
    message: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  const scannerInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isProformaModalOpen, setIsProformaModalOpen] = useState<boolean>(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState<boolean>(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState<boolean>(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState<boolean>(false);
  const [customHoldName, setCustomHoldName] = useState<string>('');

  // Held carts feature (Mettre en attente / Rappeler)
  const [heldCarts, setHeldCarts] = useState<
    Array<{ id: string; date: string; items: any[]; clientName: string }>
  >([]);

  // Catalog filters & view options
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [showSalesChart, setShowSalesChart] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [mobilePosTab, setMobilePosTab] = useState<'cart' | 'catalog'>('cart');

  // Checkout drawer state
  const [selectedClientId, setSelectedClientId] = useState<string>('comptoir');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');
  const [amountGivenUSD, setAmountGivenUSD] = useState<number>(0);
  const [discountUSD, setDiscountUSD] = useState<number>(0);
  const [posNotes, setPosNotes] = useState<string>('');

  // TVA state for POS cart (allows deactivating TVA on-the-fly or inheriting from settings)
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(
    Boolean(settings.dgiIsVatSubject && settings.enableTaxByDefault)
  );

  useEffect(() => {
    setIsVatEnabled(Boolean(settings.dgiIsVatSubject && settings.enableTaxByDefault));
  }, [settings.dgiIsVatSubject, settings.enableTaxByDefault]);

  // Auto-switch pricing tier when client is selected
  useEffect(() => {
    const client = clients.find(c => c.id === selectedClientId);
    if (client && client.pricingTier) {
      setPosPricingTier(client.pricingTier);
      showToast(
        `Tarif ${client.pricingTier === 'WHOLESALE' ? 'Grossiste' : client.pricingTier === 'SEMI_WHOLESALE' ? 'Demi-Gros' : 'Détail'} appliqué pour ${client.name}`,
        'info'
      );
    }
  }, [selectedClientId, clients]);

  // Auto-focus scanner input when component mounts or on key press
  useEffect(() => {
    if (isScannerFocused && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [isScannerFocused]);

  // Audio synthesizer beep for barcode scan feedback
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isSuccess) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      }
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setScanNotification({ message, type });
    setTimeout(() => {
      setScanNotification(null);
    }, 2800);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Handle Barcode Scan / Fast Product Lookup
  const handleScannerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let rawQuery = searchQuery.trim();
    if (!rawQuery) return;

    // Check for quantity multiplier syntax like "5*ART01" or "10xART01"
    let targetQty = scanQuantity > 0 ? scanQuantity : 1;
    const multiplierMatch = rawQuery.match(/^(\d+(?:[.,]\d+)?)\s*[*xX]\s*(.+)$/);
    if (multiplierMatch) {
      targetQty = parseFloat(multiplierMatch[1].replace(',', '.')) || targetQty;
      rawQuery = multiplierMatch[2].trim();
    }

    const query = rawQuery.toLowerCase();

    // 1. Check exact match by barcode or SKU code
    const exactMatch = products.find(
      (p) =>
        p.isActive &&
        ((p.barcode && p.barcode.toLowerCase() === query) ||
          p.code.toLowerCase() === query)
    );

    if (exactMatch) {
      if (exactMatch.type === 'PRODUCT' && exactMatch.stockQty <= 0) {
        playBeep(false);
        showToast(`Stock épuisé pour "${exactMatch.name}" !`, 'warning');
      } else {
        addToCart(exactMatch, targetQty);
        playBeep(true);
        showToast(`✓ Scanné : ${exactMatch.name} (+${targetQty})`, 'success');
      }
      setSearchQuery('');
      if (scannerInputRef.current) scannerInputRef.current.focus();
      return;
    }

    // 2. Partial match if single hit
    const partialMatches = products.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query)))
    );

    if (partialMatches.length === 1) {
      const match = partialMatches[0];
      if (match.type === 'PRODUCT' && match.stockQty <= 0) {
        playBeep(false);
        showToast(`Stock épuisé pour "${match.name}" !`, 'warning');
      } else {
        addToCart(match, targetQty);
        playBeep(true);
        showToast(`✓ Ajouté : ${match.name} (+${targetQty})`, 'success');
      }
      setSearchQuery('');
      if (scannerInputRef.current) scannerInputRef.current.focus();
      return;
    }

    if (partialMatches.length === 0) {
      playBeep(false);
      showToast(`Aucun article trouvé pour le code "${query}"`, 'warning');
    }
  };

  // Quick scan simulation from test buttons or camera or visual catalog
  const handleDirectScanProduct = (product: ProductOrService, customQty?: number) => {
    if (product.type === 'PRODUCT' && product.stockQty <= 0) {
      playBeep(false);
      showToast(`Stock épuisé pour "${product.name}" !`, 'warning');
      return;
    }
    const qtyToAdd = customQty !== undefined ? customQty : (scanQuantity > 0 ? scanQuantity : 1);
    addToCart(product, qtyToAdd);
    playBeep(true);
    showToast(`✓ Ajouté : ${product.name} (+${qtyToAdd})`, 'success');
    if (scannerInputRef.current) scannerInputRef.current.focus();
  };

  // Predictive search suggestions when typing in the scanner input
  const liveScanSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter(
        (p) =>
          p.isActive &&
          (p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q)))
      )
      .slice(0, 5);
  }, [products, searchQuery]);

  // Catalog items filtered for the visual grid
  const catalogItems = useMemo(() => {
    return products.filter((item) => {
      if (!item.isActive) return false;
      const matchSearch =
        catalogSearch === '' ||
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(catalogSearch.toLowerCase()));

      const matchType = selectedType === 'ALL' || item.type === selectedType;
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

      return matchSearch && matchType && matchCategory;
    });
  }, [products, catalogSearch, selectedType, selectedCategory]);

  // Cart calculations with VAT (supports disabling VAT on-the-fly or by default)
  const cartSubtotalUSD = cart.reduce((sum, it) => sum + it.subtotalUSD, 0);
  const cartTaxPercent = isVatEnabled ? (settings.taxPercent || 16) : 0;
  const cartTaxAmountUSD = isVatEnabled
    ? cart.filter((i) => i.taxGroup === 'A').reduce((sum, it) => sum + it.subtotalUSD * (cartTaxPercent / 100), 0)
    : 0;

  const cartTotalUSD = Math.max(0, cartSubtotalUSD - discountUSD) + cartTaxAmountUSD;
  const cartTotalCDF = Math.round(cartTotalUSD * rate);
  const dualTotal = formatDualCurrency(cartTotalUSD, rate);

  // Checkout for immediate sale (Receipt / Invoice)
  const handleCheckout = (
    isFullPaid = true,
    explicitPaidUSD?: number,
    explicitMethod?: PaymentMethod,
    explicitNotes?: string
  ) => {
    if (cart.length === 0) return;

    const finalMethod = explicitMethod || paymentMethod;
    const paidUSD = explicitPaidUSD !== undefined
      ? explicitPaidUSD
      : (isFullPaid ? cartTotalUSD : Math.min(cartTotalUSD, amountGivenUSD));

    const finalNotes = explicitNotes || posNotes.trim() || undefined;

    const validItems = cart
      .filter((i) => (i.quantity || 0) > 0)
      .map((i) => ({
        itemId: i.itemId,
        name: i.name,
        code: i.code,
        type: i.type,
        unit: i.unit,
        quantity: i.quantity,
        unitPriceUSD: i.unitPriceUSD,
        unitCostPriceUSD: i.unitCostPriceUSD,
        subtotalUSD: i.subtotalUSD,
        taxGroup: i.taxGroup || 'A',
        taxRate: isVatEnabled ? (i.taxRate || cartTaxPercent) : 0,
        taxAmountUSD: isVatEnabled ? (i.taxAmountUSD || (i.subtotalUSD * (cartTaxPercent / 100))) : 0,
      }));

    if (validItems.length === 0) return;

    const sale = createSale({
      type: 'RECEIPT',
      clientId: selectedClientId,
      items: validItems,
      discountUSD,
      taxPercent: cartTaxPercent,
      amountPaidUSD: paidUSD,
      paymentMethod: finalMethod,
      notes: finalNotes,
      isNormalizedDGI: true,
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}

    clearCart();
    setDiscountUSD(0);
    setAmountGivenUSD(0);
    setPosNotes('');

    // Open ticket modal immediately for printing
    setActivePrintSale(sale);
  };

  // Open modal to hold cart with custom name/table/ticket
  const handleOpenHoldModal = () => {
    if (cart.length === 0) return;
    const client = clients.find((c) => c.id === selectedClientId);
    setCustomHoldName(client ? client.name : `Client Comptoir ${heldCarts.length + 1}`);
    setIsHoldModalOpen(true);
  };

  // Confirm hold cart
  const handleConfirmHoldCart = (nameToUse?: string) => {
    if (cart.length === 0) return;
    const client = clients.find((c) => c.id === selectedClientId);
    const resolvedName = (nameToUse || customHoldName).trim() || (client ? client.name : 'Client Comptoir');
    const held = {
      id: `hold-${Date.now()}`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      clientName: resolvedName,
    };
    setHeldCarts((prev) => [held, ...prev]);
    clearCart();
    setIsHoldModalOpen(false);
    setCustomHoldName('');
    showToast(`Panier mis en attente (${held.clientName})`, 'info');
  };

  // Restore held cart
  const handleRestoreCart = (heldId: string) => {
    const target = heldCarts.find((h) => h.id === heldId);
    if (!target) return;
    target.items.forEach((it) => {
      const prod = products.find((p) => p.id === it.itemId);
      if (prod) {
        addToCart(prod, it.quantity);
      }
    });
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldId));
    showToast(`Panier "${target.clientName}" rappelé`, 'success');
  };

  // Remove held cart without restoring
  const handleRemoveHeldCart = (heldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHeldCarts((prev) => prev.filter((h) => h.id !== heldId));
    showToast('Panier en attente supprimé', 'info');
  };

  const paymentOptions: PaymentMethod[] = [
    'MPESA',
    'ORANGE_MONEY',
    'AIRTEL_MONEY',
    'AFRIMONEY',
    'CASH_USD',
    'CASH_CDF',
    'BANK_TRANSFER',
    'CREDIT',
  ];

  // Raccourcis Clavier Rapides (Fast Keys) pour le Caissier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support Alt+1, Alt+2, Alt+3 for rapid pricing tier switching
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1' || e.code === 'Digit1') {
          e.preventDefault();
          setPosPricingTier('RETAIL');
          showToast('Tarif : Détail sélectionné [Alt+1]', 'info');
          return;
        }
        if (e.key === '2' || e.code === 'Digit2') {
          e.preventDefault();
          setPosPricingTier('SEMI_WHOLESALE');
          showToast('Tarif : Demi-Gros sélectionné [Alt+2]', 'info');
          return;
        }
        if (e.key === '3' || e.code === 'Digit3') {
          e.preventDefault();
          setPosPricingTier('WHOLESALE');
          showToast('Tarif : Grossiste sélectionné [Alt+3]', 'info');
          return;
        }
        return;
      }

      // Don't trigger if ctrl or alt or meta are held for other keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // F2: Ouvrir la recherche/scanner
      if (e.key === 'F2') {
        e.preventDefault();
        if (scannerInputRef.current) {
          scannerInputRef.current.focus();
          scannerInputRef.current.select();
          showToast('Focus Scanner [F2]', 'info');
        }
        return;
      }

      // F4: Changer de mode de paiement (cycle rapide)
      if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMethod((prev) => {
          const idx = paymentOptions.indexOf(prev);
          const next = paymentOptions[(idx + 1) % paymentOptions.length];
          showToast(`Mode : ${getPaymentMethodLabel(next).label} [F4]`, 'info');
          return next;
        });
        return;
      }

      // F7: Réimprimer Facture / Ticket (Sécurisé par Mot de Passe)
      if (e.key === 'F7') {
        e.preventDefault();
        setIsReprintModalOpen(true);
        return;
      }

      // F8: Facture Proforma
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsProformaModalOpen(true);
        } else {
          showToast('Ajoutez des articles pour le Devis Proforma [F8]', 'warning');
        }
        return;
      }

      // F9: Calculateur Rendu Bidevise / Payer
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsChangeModalOpen(true);
        } else {
          showToast('Panier vide ! Ajoutez des articles [F9]', 'warning');
        }
        return;
      }

      // Espace: Valider vente directe si non dans un champ de saisie
      if (e.code === 'Space' || e.key === ' ') {
        const target = e.target as HTMLElement;
        const isInputField =
          target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
        if (!isInputField && cart.length > 0 && !isChangeModalOpen && !isProformaModalOpen && !isHoldModalOpen) {
          e.preventDefault();
          handleCheckout(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentOptions, isChangeModalOpen, isProformaModalOpen, isHoldModalOpen]);

  const cartTotalItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 min-h-[calc(100vh-6rem)]">
      {/* Mobile Segmented Toggle between Cart/Scanner and Catalog */}
      <div className="lg:hidden flex items-center bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs w-full">
        <button
          type="button"
          onClick={() => setMobilePosTab('cart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[42px] ${
            mobilePosTab === 'cart'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 active:bg-neutral-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Panier & Caisse</span>
          {cartTotalItemCount > 0 && (
            <span className="bg-amber-400 text-neutral-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono-nums font-black">
              {cartTotalItemCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMobilePosTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[42px] ${
            mobilePosTab === 'catalog'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 active:bg-neutral-100'
          }`}
        >
          <Package className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Catalogue & Favoris</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* COLONNE PRINCIPALE DE CAISSE (Recherche/Scan en haut + Panier en dessous) */}
      {/* ============================================================== */}
      <div className={`w-full lg:w-[58%] xl:w-[60%] flex-col gap-4 ${mobilePosTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
        {/* ------------------------------------------------------------ */}
        {/* SECTION 1 : RECHERCHE DE PRODUIT & SCANNER CODE-BARRES       */}
        {/* ------------------------------------------------------------ */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-4 space-y-3 relative overflow-visible">
          {/* Top Bar: Title & Scanner Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            {/* Title & Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-amber-400 flex items-center justify-center shadow-2xs shrink-0">
                <ScanLine className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight whitespace-nowrap">
                    Recherche & Scanner Code-Barres
                  </h2>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lecteur actif [F2]</span>
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                  Scannez avec votre lecteur USB/Bluetooth ou saisissez un nom/référence
                </p>
              </div>
            </div>

            {/* Action: Réimprimer Facture [F7] */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Reprint Invoice / Receipt Button */}
              <button
                type="button"
                onClick={() => setIsReprintModalOpen(true)}
                className="h-8.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all border border-neutral-800 shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Touche F7 : Réimprimer une facture ou un ticket sécurisé par mot de passe superviseur"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Réimprimer Facture</span>
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 text-amber-300 rounded text-[9px] font-mono font-bold leading-none shrink-0 shadow-2xs">
                  F7
                </kbd>
              </button>
            </div>
          </div>

          {/* Barcode Search Form & Fast Enter Handler with Quantity Input */}
          <form onSubmit={handleScannerSubmit} className="flex items-center gap-2">
            {/* Saisie rapide de la quantité avant scan / sélection */}
            <div
              className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 rounded-xl px-2.5 py-1.5 shrink-0 transition-colors shadow-2xs"
              title="Quantité à appliquer au scan ou clic catalogue (ex: 5)"
            >
              <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">Qté:</span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={scanQuantity === 0 ? '' : scanQuantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setScanQuantity(0);
                  } else {
                    const num = parseFloat(val);
                    setScanQuantity(isNaN(num) || num <= 0 ? 1 : num);
                  }
                }}
                onBlur={() => {
                  if (!scanQuantity || scanQuantity <= 0) setScanQuantity(1);
                }}
                onFocus={(e) => e.target.select()}
                className="w-12 text-center font-mono-nums font-bold text-neutral-900 text-xs bg-white border border-neutral-300 rounded px-1 py-1 focus:outline-none focus:border-neutral-900 shadow-2xs"
                placeholder="1"
              />
            </div>

            <div className="relative flex-1 flex items-center">
              <input
                ref={scannerInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scanner code-barres (ou tapez 5*REF pour qté 5)..."
                className="w-full pl-10 pr-36 sm:pr-48 py-2.5 bg-neutral-50 hover:bg-white focus:bg-white border-2 border-neutral-300 focus:border-neutral-900 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all shadow-inner"
              />
              <ScanLine className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-neutral-400 hover:text-neutral-600 text-xs"
                    title="Effacer la saisie"
                  >
                    Effacer
                  </button>
                )}

                {/* Camera Scanner Button on the barcode search bar */}
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="h-7.5 px-2 sm:px-2.5 bg-white hover:bg-blue-50 text-neutral-700 hover:text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-200/90 shadow-2xs active:scale-95 shrink-0"
                  title="Scanner avec la caméra vidéo ou tester un code"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="hidden sm:inline">Caméra</span>
                </button>

                <button
                  type="submit"
                  className="h-7.5 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-2xs active:scale-95 shrink-0"
                  title="Ajouter au panier"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter</span>
                </button>
              </div>

              {/* Predictive Dropdown Suggestions */}
              {liveScanSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl z-30 divide-y divide-neutral-100 overflow-hidden">
                  <div className="px-3 py-1.5 bg-neutral-50 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Résultats correspondants ({liveScanSuggestions.length})</span>
                    <span>Appuyez sur Entrée ou cliquez pour ajouter</span>
                  </div>
                  {liveScanSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleDirectScanProduct(item)}
                      className="p-2.5 hover:bg-amber-50/50 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {item.type === 'PRODUCT' ? (
                            <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <span className="font-bold text-xs text-neutral-900 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 font-mono-nums">
                          <span>Réf: {item.code}</span>
                          {item.barcode && <span className="text-blue-700">EAN: {item.barcode}</span>}
                          {item.type === 'PRODUCT' && (
                            <span
                              className={item.stockQty <= 0 ? 'text-rose-600 font-semibold' : 'text-neutral-600'}
                            >
                              Stock: {item.stockQty}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 font-mono-nums">
                          ${item.priceUSD.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="px-2 py-1 bg-neutral-900 text-amber-400 hover:bg-neutral-800 rounded-md text-[11px] font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Panier</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Quick Simulation Chips / Common Test Barcodes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-neutral-400 text-[10px] uppercase font-semibold shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Scans Rapides :
            </span>
            {products
              .filter((p) => p.isActive && p.type === 'PRODUCT')
              .slice(0, 4)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleDirectScanProduct(p)}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 text-neutral-700 rounded-lg shrink-0 font-medium transition-colors flex items-center gap-1 border border-neutral-200/70"
                >
                  <span className="truncate max-w-[120px]">{p.name.split('(')[0]}</span>
                  <span className="font-mono-nums font-bold text-neutral-900">${p.priceUSD}</span>
                </button>
              ))}
          </div>

          {/* Ergonomic Fast Keys Helper Bar for Cashier */}
          <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 bg-neutral-900 text-white rounded-xl text-[11px] font-mono overflow-x-auto no-scrollbar shadow-xs">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1">
              ⌨️ Fast Keys :
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  scannerInputRef.current?.focus();
                  scannerInputRef.current?.select();
                }}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Touche F2 : Focaliser le champ scanner"
              >
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold text-amber-300">F2</kbd>
                <span className="text-neutral-300">Scanner</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod((prev) => {
                    const idx = paymentOptions.indexOf(prev);
                    const next = paymentOptions[(idx + 1) % paymentOptions.length];
                    showToast(`Mode : ${getPaymentMethodLabel(next).label} [F4]`, 'info');
                    return next;
                  });
                }}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Touche F4 : Changer rapidement de mode de paiement"
              >
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold text-amber-300">F4</kbd>
                <span className="text-emerald-400 font-semibold">{getPaymentMethodLabel(paymentMethod).label.split(' ')[0]}</span>
              </button>

              {/* Alt+1/2/3 Pricing Tier Shortcut */}
              <button
                type="button"
                onClick={() => {
                  const tiers: Array<'RETAIL' | 'SEMI_WHOLESALE' | 'WHOLESALE'> = ['RETAIL', 'SEMI_WHOLESALE', 'WHOLESALE'];
                  const nextIdx = (tiers.indexOf(posPricingTier) + 1) % tiers.length;
                  const next = tiers[nextIdx];
                  setPosPricingTier(next);
                  showToast(`Tarif : ${next === 'WHOLESALE' ? 'Grossiste' : next === 'SEMI_WHOLESALE' ? 'Demi-Gros' : 'Détail'}`, 'info');
                }}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Touches Alt+1 (Détail), Alt+2 (Demi-Gros), Alt+3 (Grossiste)"
              >
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold text-amber-300">Alt+1/2/3</kbd>
                <span className="text-amber-400 font-semibold">
                  {posPricingTier === 'WHOLESALE' ? 'Grossiste' : posPricingTier === 'SEMI_WHOLESALE' ? '½ Gros' : 'Détail'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsReprintModalOpen(true)}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Touche F7 : Réimprimer une facture ou un ticket avec mot de passe"
              >
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold text-amber-300">F7</kbd>
                <span className="text-amber-300 font-semibold">Réimprimer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsProformaModalOpen(true);
                  else showToast('Panier vide !', 'warning');
                }}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Touche F8 : Émettre une facture proforma"
              >
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold text-amber-300">F8</kbd>
                <span className="text-blue-300">Proforma</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) setIsChangeModalOpen(true);
                  else showToast('Panier vide !', 'warning');
                }}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Touche F9 : Ouvrir le calculateur de rendu de monnaie bidevise USD/CDF"
              >
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold text-amber-300">F9</kbd>
                <span className="text-emerald-300">Rendu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cart.length > 0) handleCheckout(true);
                }}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Touche Espace : Valider la vente directe et imprimer le ticket"
              >
                <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold text-amber-300">Espace</kbd>
                <span className="text-neutral-300">Valider</span>
              </button>
            </div>
          </div>

          {/* Scan Toast notification */}
          {scanNotification && (
            <div
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                scanNotification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : scanNotification.type === 'warning'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">{scanNotification.message}</span>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------ */}
        {/* SECTION 2 : LE PANIER (CART) DIRECTEMENT EN-DESSOUS         */}
        {/* ------------------------------------------------------------ */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex-1 flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="p-3.5 sm:p-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 text-amber-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                  <span>Panier Express Caisse</span>
                  <span className="bg-amber-400 text-neutral-900 px-2 py-0.5 rounded-full text-[10px] font-mono-nums font-extrabold">
                    {cart.reduce((s, i) => s + i.quantity, 0)} articles
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400 hidden sm:block">
                  Articles scannés prêts pour encaissement ou devis proforma
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Held Carts Recall */}
              {heldCarts.length > 0 && (
                <div className="relative group">
                  <button
                    type="button"
                    className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    title="Paniers en attente"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>En attente ({heldCarts.length})</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white text-neutral-900 border border-neutral-200 rounded-xl shadow-xl p-2 w-72 z-30 hidden group-hover:block divide-y divide-neutral-100">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase px-2 py-1 block">
                      Rappeler un panier mis en attente :
                    </span>
                    {heldCarts.map((h) => {
                      const totalHUSD = h.items.reduce((s: number, it: any) => s + (it.subtotalUSD || 0), 0);
                      const totalHCDF = Math.round(totalHUSD * rate);
                      return (
                        <div
                          key={h.id}
                          onClick={() => handleRestoreCart(h.id)}
                          className="p-2.5 hover:bg-neutral-50 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold block truncate text-neutral-900">{h.clientName}</span>
                            <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                              <span>{h.date}</span>
                              <span>·</span>
                              <span>{h.items.length} article(s)</span>
                              <span>·</span>
                              <span className="font-semibold text-neutral-900">${totalHUSD.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-blue-600 font-semibold text-[11px] bg-blue-50 px-2 py-0.5 rounded">Rappeler</span>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveHeldCart(h.id, e)}
                              className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Supprimer ce panier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenHoldModal}
                    className="text-[11px] text-neutral-300 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1 border border-neutral-700"
                    title="Mettre ce panier en attente avec un nom de client ou table"
                  >
                    <Pause className="w-3 h-3" />
                    <span className="hidden sm:inline">En attente</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                    title="Vider le panier"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Vider</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cart Items Table / List */}
          <div className="p-3 overflow-y-auto max-h-[340px] flex-1 divide-y divide-neutral-100">
            {cart.length === 0 ? (
              <div className="h-44 sm:h-52 flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <ShoppingCart className="w-6 h-6 stroke-1" />
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-neutral-700">Le panier est vide</p>
                  <p className="text-[11px] text-neutral-400 max-w-sm mt-0.5">
                    Scannez un code-barres avec la douchette ou cliquez sur les produits dans le catalogue à droite pour les ajouter directement.
                  </p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.itemId}
                  className="py-2.5 px-1 flex items-center justify-between gap-2.5 text-xs hover:bg-neutral-50/70 transition-colors rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900 block truncate">{item.name}</span>
                      <span className="text-[10px] font-mono-nums px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded shrink-0">
                        Gr. {item.taxGroup}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono-nums mt-0.5">
                      <span>${item.unitPriceUSD.toFixed(2)} / {item.unit}</span>
                      <span>·</span>
                      <span className="text-neutral-400">{item.code}</span>
                    </div>
                  </div>

                  {/* Quantity modifier (+ / - / Saisie directe) */}
                  <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeFromCart(item.itemId);
                        } else {
                          updateCartQuantity(item.itemId, item.quantity - 1);
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-white rounded transition-colors"
                      title="Diminuer la quantité (-1)"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          updateCartQuantity(item.itemId, 0);
                        } else {
                          const num = parseFloat(val);
                          updateCartQuantity(item.itemId, isNaN(num) ? 0 : num);
                        }
                      }}
                      onBlur={() => {
                        if (!item.quantity || item.quantity <= 0) {
                          updateCartQuantity(item.itemId, 1);
                        }
                      }}
                      className="w-12 text-center font-mono-nums font-bold text-neutral-900 text-xs bg-white border border-neutral-300 rounded px-1 py-0.5 focus:outline-none focus:border-neutral-900 shadow-2xs"
                      title="Cliquer pour saisir directement la quantité"
                      placeholder="1"
                    />
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.itemId, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:bg-white rounded transition-colors"
                      title="Augmenter la quantité (+1)"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Subtotal */}
                  <div className="text-right w-20 shrink-0 font-mono-nums">
                    <span className="font-bold text-neutral-900 block text-xs sm:text-sm">
                      ${item.subtotalUSD.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      {Math.round(item.subtotalUSD * rate).toLocaleString()} FC
                    </span>
                  </div>

                  {/* Trash Item */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.itemId)}
                    className="text-neutral-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                    title="Supprimer la ligne"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer: Client, Mode, Totals & Action Buttons (Proforma & Checkout) */}
          {cart.length > 0 && (
            <div className="p-4 bg-neutral-50/90 border-t border-neutral-200 space-y-3.5">
              {/* Row 1: Client Selector & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Client Assign */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-500" />
                      Client
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickClientOpen(true)}
                      className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-0.5"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Nouveau</span>
                    </button>
                  </div>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  >
                    <option value="comptoir">Client Comptoir (Consommateur Final)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Mode de Règlement RDC
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  >
                    {paymentOptions.map((opt) => {
                      const info = getPaymentMethodLabel(opt);
                      return (
                        <option key={opt} value={opt}>
                          {info.label} ({info.provider})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Row 1.5: TVA Toggle (Activer / Désactiver la TVA pour ce panier) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isVatEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">
                      TVA ({settings.taxPercent || 16}%)
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {isVatEnabled
                        ? 'TVA 16% active pour ce panier'
                        : 'TVA désactivée (0% Hors Taxe / Exonéré)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isVatEnabled;
                    setIsVatEnabled(next);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                    isVatEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-neutral-300 hover:bg-neutral-400 text-neutral-800'
                  }`}
                  title={isVatEnabled ? 'Cliquez pour désactiver la TVA sur ce panier' : 'Cliquez pour activer la TVA sur ce panier'}
                >
                  {isVatEnabled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Active (16%)</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Désactivée (0%)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Row 2: Totals Display with Dual Currency & VAT */}
              <div className="bg-white p-3 rounded-xl border border-neutral-200/90 space-y-1.5 font-mono-nums text-xs shadow-2xs">
                <div className="flex justify-between text-neutral-600 text-[11px]">
                  <span>Total HT :</span>
                  <span>${cartSubtotalUSD.toFixed(2)}</span>
                </div>
                {isVatEnabled ? (
                  <div className="flex justify-between text-neutral-600 text-[11px]">
                    <span>TVA RDC ({settings.taxPercent || 16}%) DGI :</span>
                    <span className="text-emerald-700 font-semibold">+${cartTaxAmountUSD.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-neutral-500 text-[11px] italic">
                    <span>TVA :</span>
                    <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[10px] font-sans not-italic font-medium">
                      Désactivée (0% Exonéré)
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1 border-t border-neutral-100">
                  <span>TOTAL TTC ($ USD) :</span>
                  <span className="text-neutral-950 font-black">{dualTotal.usd}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 bg-amber-100/70 px-2.5 py-1 rounded-lg text-xs">
                  <span>TOTAL TTC (Franc Congolais CDF) :</span>
                  <span className="font-extrabold">{dualTotal.cdf}</span>
                </div>
              </div>

              {/* Row 2.5: Fast Cash Tendered Denominations for CASH_USD & CASH_CDF */}
              {(paymentMethod === 'CASH_USD' || paymentMethod === 'CASH_CDF') && (
                <div className="p-2.5 bg-neutral-100 rounded-xl border border-neutral-200/90 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5 text-[11px]">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>Coupures Espèces Rapides :</span>
                    </span>
                    {amountGivenUSD > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmountGivenUSD(0)}
                        className="text-[10px] text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  {/* Denomination quick keys */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAmountGivenUSD(cartTotalUSD)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        amountGivenUSD === cartTotalUSD
                          ? 'bg-neutral-900 text-amber-400 border-neutral-900 shadow-2xs'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      Exact
                    </button>

                    {/* USD Banknotes */}
                    {[10, 20, 50, 100].map((val) => (
                      <button
                        key={`usd-${val}`}
                        type="button"
                        onClick={() => setAmountGivenUSD(val)}
                        className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                          amountGivenUSD === val
                            ? 'bg-neutral-900 text-amber-400 border-neutral-900 shadow-2xs'
                            : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}

                    {/* CDF Banknotes */}
                    {[10000, 20000, 50000, 100000].map((cdfVal) => {
                      const usdEquiv = cdfVal / rate;
                      const isSelected = Math.abs(amountGivenUSD - usdEquiv) < 0.02;
                      return (
                        <button
                          key={`cdf-${cdfVal}`}
                          type="button"
                          onClick={() => setAmountGivenUSD(usdEquiv)}
                          className={`px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-amber-400 border-neutral-900 shadow-2xs'
                              : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {cdfVal / 1000}k FC
                        </button>
                      );
                    })}
                  </div>

                  {/* Change calculation preview */}
                  {amountGivenUSD > 0 && (
                    <div className="pt-1.5 border-t border-neutral-200/80 flex items-center justify-between text-[11px] font-mono-nums">
                      <div>
                        <span className="text-neutral-500">Reçu : </span>
                        <span className="font-bold text-neutral-900">
                          ${amountGivenUSD.toFixed(2)} ({Math.round(amountGivenUSD * rate).toLocaleString()} FC)
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Rendu : </span>
                        <span className={`font-black ${amountGivenUSD >= cartTotalUSD ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {amountGivenUSD >= cartTotalUSD
                            ? `$${(amountGivenUSD - cartTotalUSD).toFixed(2)} (${Math.round((amountGivenUSD - cartTotalUSD) * rate).toLocaleString()} FC)`
                            : 'Insuffisant'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Action Buttons (INCLUDING PROFORMA INVOICE & BICURRENCY CHANGE!) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Calculateur Rendu Monnaie Bidevise (F9) */}
                <button
                  type="button"
                  onClick={() => setIsChangeModalOpen(true)}
                  className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs hover:shadow-md"
                  title="Calculer le rendu de monnaie mixte USD + CDF et coupures [F9]"
                >
                  <Calculator className="w-4 h-4 text-emerald-200" />
                  <span>Rendu USD/CDF [F9]</span>
                </button>

                {/* 2. Facture Proforma Button (F8) */}
                <button
                  type="button"
                  onClick={() => setIsProformaModalOpen(true)}
                  className="py-2.5 px-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs hover:shadow-md"
                  title="Générer une offre de prix officielle / Facture Proforma pour ce panier [F8]"
                >
                  <FileText className="w-4 h-4 text-amber-300" />
                  <span>Proforma [F8]</span>
                </button>

                {/* 3. Payer & Ticket DEF */}
                <button
                  type="button"
                  onClick={() => handleCheckout(true)}
                  className="py-2.5 px-2 bg-neutral-950 hover:bg-neutral-800 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs hover:shadow-md"
                  title="Paiement immédiat et ticket normalisé DGI [Espace]"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Payer Ticket</span>
                </button>

                {/* 4. Vente à Crédit */}
                <button
                  type="button"
                  onClick={() => handleCheckout(false)}
                  className="py-2.5 px-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  title="Enregistrer comme vente à crédit / créance client"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Crédit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* COLONNE SECONDAIRE : CATALOGUE VISUEL & TOUCHES RAPIDES       */}
      {/* ============================================================== */}
      <div className={`w-full lg:w-[42%] xl:w-[40%] bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex-col overflow-hidden ${mobilePosTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Catalog Header & Filters */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-200 bg-neutral-50/70 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                Catalogue Visuel & Favoris
              </h3>
            </div>

            {/* Toggle 7-Day Chart Button */}
            <button
              type="button"
              onClick={() => setShowSalesChart(!showSalesChart)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border shadow-2xs ${
                showSalesChart
                  ? 'bg-amber-400 text-neutral-900 border-amber-500 font-bold'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
              title="Afficher les statistiques de vente sur 7 jours"
            >
              <BarChart2 className="w-3.5 h-3.5 text-neutral-900" />
              <span>Ventes 7J</span>
            </button>
          </div>

          {/* Pricing Tier Selector (Détail / Demi-Gros / Grossiste) */}
          <div className="flex items-center justify-between p-1.5 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 px-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Tarif :</span>
            </span>
            <div className="flex bg-neutral-200/80 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPosPricingTier('RETAIL')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  posPricingTier === 'RETAIL'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Tarif de vente au détail normal [Alt+1]"
              >
                <span>Détail</span>
                <kbd className="text-[9px] opacity-60 font-mono">Alt+1</kbd>
              </button>
              <button
                type="button"
                onClick={() => setPosPricingTier('SEMI_WHOLESALE')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  posPricingTier === 'SEMI_WHOLESALE'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Tarif intermédiaire demi-gros [Alt+2]"
              >
                <span>Demi-Gros</span>
                <kbd className="text-[9px] opacity-75 font-mono">Alt+2</kbd>
              </button>
              <button
                type="button"
                onClick={() => setPosPricingTier('WHOLESALE')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  posPricingTier === 'WHOLESALE'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Tarif revendeur / grossiste [Alt+3]"
              >
                <span>Grossiste</span>
                <kbd className="text-[9px] opacity-75 font-mono">Alt+3</kbd>
              </button>
            </div>
          </div>

          {/* Catalog Search & Type Selectors */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Filtrer catalogue..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex bg-neutral-200 p-0.5 rounded-lg text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => setSelectedType('ALL')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedType === 'ALL' ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-600'
                }`}
              >
                Tout
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('PRODUCT')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedType === 'PRODUCT' ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-600'
                }`}
              >
                Articles
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('SERVICE')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedType === 'SERVICE' ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-600'
                }`}
              >
                Services
              </button>
            </div>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-neutral-900 text-white font-bold shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200/80'
              }`}
            >
              Toutes Catégories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white font-bold shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-3">
          {showSalesChart && (
            <div className="w-full shrink-0">
              <PosSalesChart />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 auto-rows-max">
            {catalogItems.length === 0 ? (
              <div className="col-span-full text-center py-12 text-neutral-400 text-xs">
                Aucun produit ou service trouvé dans cette sélection.
              </div>
            ) : (
              catalogItems.map((item) => {
                const inCart = cart.find((i) => i.itemId === item.id);
                const isOutOfStock = item.type === 'PRODUCT' && item.stockQty <= 0;
                const isLowStock =
                  item.type === 'PRODUCT' && item.stockQty <= item.minStockAlert && !isOutOfStock;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOutOfStock && handleDirectScanProduct(item)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                      isOutOfStock
                        ? 'bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'bg-amber-50/60 border-amber-400 ring-1 ring-amber-400 shadow-2xs'
                        : 'bg-white border-neutral-200 hover:border-neutral-400 hover:shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-neutral-400">
                          {item.type === 'PRODUCT' ? (
                            <Package className="w-3 h-3 text-blue-600 shrink-0" />
                          ) : (
                            <Wrench className="w-3 h-3 text-amber-600 shrink-0" />
                          )}
                          <span>{item.type === 'PRODUCT' ? 'Produit' : 'Service'}</span>
                        </div>

                        {item.type === 'PRODUCT' && (
                          <span
                            className={`text-[9px] font-mono-nums font-semibold px-1 rounded ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            Stock: {item.stockQty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5 my-1">
                        {item.imageUrl && (
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
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
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 leading-snug">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-neutral-400 font-mono-nums block mt-0.5 truncate">
                            {item.code} {item.barcode ? `· ${item.barcode}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-neutral-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold font-mono-nums text-neutral-900 block leading-none">
                          ${item.priceUSD.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-mono-nums text-neutral-500 block mt-0.5">
                          {Math.round(item.priceUSD * rate).toLocaleString()} FC
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          inCart
                            ? 'bg-neutral-900 text-amber-400 font-bold'
                            : 'bg-neutral-100 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white'
                        }`}
                      >
                        {inCart ? (
                          <span className="font-mono-nums text-[11px]">{inCart.quantity}</span>
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODALS : PROFORMA, CAMERA BARCODE SCANNER, QUICK CLIENT        */}
      {/* ============================================================== */}
      <PosProformaModal
        isOpen={isProformaModalOpen}
        onClose={() => setIsProformaModalOpen(false)}
        cartItems={cart}
        cartSubtotalUSD={cartSubtotalUSD}
        cartTaxAmountUSD={cartTaxAmountUSD}
        cartTotalUSD={cartTotalUSD}
        initialClientId={selectedClientId}
        initialVatEnabled={isVatEnabled}
        onSuccess={() => {
          clearCart();
          showToast('Facture Proforma émise avec succès !', 'success');
        }}
      />

      <PosBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(prod) => {
          handleDirectScanProduct(prod);
        }}
      />

      <PosQuickClientModal
        isOpen={isQuickClientOpen}
        onClose={() => setIsQuickClientOpen(false)}
        onClientCreated={(newId) => {
          setSelectedClientId(newId);
          showToast('Client créé et assigné au panier', 'success');
        }}
      />

      {/* 4. Calculateur de Rendu de Monnaie Bidevise (USD & CDF) */}
      <PosDualCurrencyChangeModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        totalUSD={cartTotalUSD}
        exchangeRate={rate}
        onConfirmPayment={(paidUSD, method, notes) => {
          setIsChangeModalOpen(false);
          handleCheckout(true, paidUSD, method, notes);
        }}
      />

      {/* 5. Modal de Réimpression Sécurisée par Mot de Passe Superviseur */}
      <PosReprintModal
        isOpen={isReprintModalOpen}
        onClose={() => setIsReprintModalOpen(false)}
      />

      {/* 5. Modal de Mise en Attente avec Nom / Table / Ticket */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pause className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Mettre le Panier en Attente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmHoldCart();
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Nom du panier / Table / N° Ticket :
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customHoldName}
                  onChange={(e) => setCustomHoldName(e.target.value)}
                  placeholder="Ex : Client comptoir 2, Vente M. Ilunga, Table 4..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 transition-all"
                />
              </div>

              {/* Suggestions rapides */}
              <div>
                <span className="text-[11px] text-neutral-500 font-medium block mb-1.5">
                  Suggestions rapides :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    `Comptoir ${heldCarts.length + 1}`,
                    'Client Espèces',
                    'Vente M. Ilunga',
                    'Table VIP 1',
                    'Commande WhatsApp',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setCustomHoldName(sug)}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">Panier actif :</span> {cart.reduce((s, i) => s + i.quantity, 0)} article(s) pour un total de <span className="font-bold font-mono">${cartTotalUSD.toFixed(2)} USD</span> ({cartTotalCDF.toLocaleString()} FC). Vous pourrez rappeler ce panier à tout moment en 1 clic.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsHoldModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Confirmer la mise en attente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Cart Action Bar when viewing catalog */}
      {mobilePosTab === 'catalog' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30 animate-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={() => setMobilePosTab('cart')}
            className="w-full bg-neutral-950 text-white p-3 rounded-2xl shadow-xl border border-neutral-800 flex items-center justify-between min-h-[48px] active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-amber-400 text-neutral-950 font-mono font-extrabold text-xs flex items-center justify-center shrink-0">
                {cartTotalItemCount}
              </span>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Panier : ${cartTotalUSD.toFixed(2)}</div>
                <div className="text-[10px] text-amber-300 font-mono-nums">{Math.round(cartTotalUSD * rate).toLocaleString('fr-FR')} FC</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>Voir Panier & Payer</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
