import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PortalCatalog } from './PortalCatalog';
import { PortalProformaCart } from './PortalProformaCart';
import { PortalClientQuotes } from './PortalClientQuotes';
import { PortalAuthModal } from './PortalAuthModal';
import { PortalB2BEquipments } from './PortalB2BEquipments';
import { PortalB2BInvoices } from './PortalB2BInvoices';
import { PortalB2BSupportTicket } from './PortalB2BSupportTicket';
import { formatDualCurrency } from '../../utils/formatters';
import {
  Globe,
  ShoppingBag,
  FileText,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Building,
  Phone,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Store,
  Layers,
  Clock,
  CheckCircle2,
  Receipt,
  Check,
  ChevronRight,
  Radio,
  Wrench
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ClientPortalView: React.FC = () => {
  const {
    products,
    clients,
    sales,
    settings,
    selectedCurrency,
    setSelectedCurrency,
    setActiveTab,
    setActivePrintSale,
    portalClient,
    setPortalClient,
    portalCart,
    addToPortalCart,
    updatePortalCartQuantity,
    removeFromPortalCart,
    clearPortalCart,
    loginPortalClient,
    registerPortalClient,
    logoutPortalClient,
    createPortalProforma,
  } = useApp();

  const [activePortalTab, setActivePortalTab] = useState<'CATALOG' | 'CART' | 'MY_QUOTES' | 'MY_EQUIPMENTS' | 'MY_INVOICES' | 'SUPPORT_SAV' | 'ACCOUNT'>('CATALOG');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');

  const rate = settings.exchangeRateUSD_CDF || 2850;
  const cartItemsCount = portalCart.reduce((sum, item) => sum + item.quantity, 0);

  // Client proformas count
  const myQuotesCount = sales.filter((s) => {
    if (s.type !== 'QUOTE_PROFORMA') return false;
    if (!portalClient) return false;
    return (
      s.clientId === portalClient.id ||
      s.clientName.toLowerCase().includes(portalClient.name.toLowerCase()) ||
      (portalClient.companyName && s.clientName.toLowerCase().includes(portalClient.companyName.toLowerCase()))
    );
  }).length;

  const handleGenerateProforma = (params: {
    notes?: string;
    validityDays?: number;
    isVatActive?: boolean;
    guestName?: string;
    guestCompany?: string;
    guestPhone?: string;
  }) => {
    // If not logged in, but provided guest info, auto-create client or register
    if (!portalClient && params.guestName && params.guestPhone) {
      registerPortalClient({
        name: params.guestName,
        companyName: params.guestCompany || undefined,
        type: params.guestCompany ? 'COMPANY' : 'INDIVIDUAL',
        phone: params.guestPhone,
        whatsapp: params.guestPhone,
        city: settings.city || '',
        isVatSubject: Boolean(params.guestCompany),
        isRegisteredOnPortal: true,
      });
    }

    const newSale = createPortalProforma({
      notes: params.notes,
      validityDays: params.validityDays,
      isVatActive: params.isVatActive,
      guestName: params.guestName,
      guestCompany: params.guestCompany,
      guestPhone: params.guestPhone,
    });

    return newSale;
  };

  const handleWhatsAppContact = () => {
    const rawPhone = (settings.phone1 || '+243812345678').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Bonjour ${settings.name}, je consulte votre portail client et souhaite avoir des renseignements sur vos produits et prestations.`
    );
    window.open(`https://wa.me/${rawPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Portal Banner with Branding & Quick Navigation */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-neutral-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Company Brand info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-neutral-950 shadow-xs flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Portail Client B2B & B2C · RDC
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{settings.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              {settings.slogan || 'Catalogue de Produits & Prestations de Services avec Générateur de Facture Proforma Conforme DGI.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{settings.address || 'Boulevard du 30 Juin'}{settings.city ? `, ${settings.city}` : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{settings.phone1}</span>
              </div>
            </div>
          </div>

          {/* Quick Portal Header Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">

            {/* Return to Admin / POS */}
            <button
              onClick={() => setActiveTab('pos')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors flex items-center justify-center gap-1.5 border border-white/10"
              title="Retourner à la gestion de caisse et facturation"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Espace Caisse / Administration</span>
            </button>

            {/* WhatsApp Contact Button */}
            <button
              onClick={handleWhatsAppContact}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Assistance Commerciale WhatsApp</span>
            </button>

            {/* Client Account Status */}
            {portalClient ? (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 font-black flex items-center justify-center text-[10px]">
                  {portalClient.name[0]?.toUpperCase() || 'C'}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white text-xs leading-none">
                    {portalClient.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-300 font-mono">Compte Actif</div>
                </div>
                <button
                  onClick={logoutPortalClient}
                  className="ml-2 p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthModalMode('LOGIN');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connexion</span>
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('REGISTER');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Créer un Compte</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feature badges row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-neutral-700/60 text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Matériels Garantis 100% Neufs</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Prestations Réseau & Solaire</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Double Devise USD / Franc Congolais</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Devis Proforma Normalisé DGI</span>
          </div>
        </div>
      </div>

      {/* Main Portal Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-neutral-200/90 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActivePortalTab('CATALOG')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activePortalTab === 'CATALOG'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Catalogue Produits & Services</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activePortalTab === 'CATALOG' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActivePortalTab('CART')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all relative ${
              activePortalTab === 'CART'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mon Panier Proforma</span>
            {cartItemsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold font-mono-nums ${
                activePortalTab === 'CART' ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
              }`}>
                {cartItemsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePortalTab('MY_QUOTES')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activePortalTab === 'MY_QUOTES'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mes Devis Enregistrés</span>
            {myQuotesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activePortalTab === 'MY_QUOTES' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {myQuotesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (portalClient) {
                setActivePortalTab('MY_EQUIPMENTS');
              } else {
                setAuthModalMode('LOGIN');
                setIsAuthModalOpen(true);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === 'MY_EQUIPMENTS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Mes Kits Starlink</span>
          </button>

          <button
            onClick={() => {
              if (portalClient) {
                setActivePortalTab('MY_INVOICES');
              } else {
                setAuthModalMode('LOGIN');
                setIsAuthModalOpen(true);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === 'MY_INVOICES'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Factures Soldées</span>
          </button>

          <button
            onClick={() => {
              if (portalClient) {
                setActivePortalTab('SUPPORT_SAV');
              } else {
                setAuthModalMode('LOGIN');
                setIsAuthModalOpen(true);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === 'SUPPORT_SAV'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Dépannage SAV</span>
          </button>

          <button
            onClick={() => {
              if (portalClient) {
                setActivePortalTab('ACCOUNT');
              } else {
                setAuthModalMode('LOGIN');
                setIsAuthModalOpen(true);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === 'ACCOUNT'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{portalClient ? 'Mon Compte' : 'Connexion / Inscription'}</span>
          </button>
        </div>
      </div>

      {/* Portal Active Viewport */}
      {activePortalTab === 'CATALOG' && (
        <PortalCatalog
          products={products}
          exchangeRate={rate}
          currency={selectedCurrency}
          portalClient={portalClient}
          onAddToCart={addToPortalCart}
          cartCount={cartItemsCount}
          onOpenCart={() => setActivePortalTab('CART')}
        />
      )}

      {activePortalTab === 'CART' && (
        <PortalProformaCart
          cart={portalCart}
          exchangeRate={rate}
          currency={selectedCurrency}
          portalClient={portalClient}
          onUpdateQuantity={updatePortalCartQuantity}
          onRemoveItem={removeFromPortalCart}
          onClearCart={clearPortalCart}
          onOpenCatalog={() => setActivePortalTab('CATALOG')}
          onOpenAuthModal={() => {
            setAuthModalMode('REGISTER');
            setIsAuthModalOpen(true);
          }}
          onGenerateProforma={handleGenerateProforma}
          onViewPrintSale={(sale) => {
            setActivePrintSale(sale);
            setActivePortalTab('MY_QUOTES');
          }}
        />
      )}

      {activePortalTab === 'MY_QUOTES' && (
        <PortalClientQuotes
          sales={sales}
          portalClient={portalClient}
          exchangeRate={rate}
          onViewPrintSale={setActivePrintSale}
          onOpenCatalog={() => setActivePortalTab('CATALOG')}
          onOpenAuthModal={() => {
            setAuthModalMode('LOGIN');
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {activePortalTab === 'MY_EQUIPMENTS' && <PortalB2BEquipments />}

      {activePortalTab === 'MY_INVOICES' && <PortalB2BInvoices />}

      {activePortalTab === 'SUPPORT_SAV' && <PortalB2BSupportTicket />}

      {activePortalTab === 'ACCOUNT' && portalClient && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-2xs max-w-2xl mx-auto space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {portalClient.name[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  {portalClient.name}
                </h2>
                <div className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                    {portalClient.type === 'COMPANY' ? 'Compte Entreprise' : 'Particulier'}
                  </span>
                  <span>•</span>
                  <span>Inscrit sur le portail</span>
                </div>
              </div>
            </div>

            <button
              onClick={logoutPortalClient}
              className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se Déconnecter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-neutral-100">
            {portalClient.companyName && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Raison Sociale
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  {portalClient.companyName}
                </span>
              </div>
            )}

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                Numéro de Téléphone
              </span>
              <span className="text-sm font-semibold text-neutral-900 font-mono">
                {portalClient.phone}
              </span>
            </div>

            {portalClient.email && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Email
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  {portalClient.email}
                </span>
              </div>
            )}

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                Ville & Commune
              </span>
              <span className="text-sm font-semibold text-neutral-900">
                {portalClient.city} {portalClient.commune ? `(${portalClient.commune})` : ''}
              </span>
            </div>

            {portalClient.nif && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Numéro Impôt (NIF)
                </span>
                <span className="text-sm font-semibold text-neutral-900 font-mono">
                  {portalClient.nif}
                </span>
              </div>
            )}

            {portalClient.address && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 sm:col-span-2">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                  Adresse de Livraison
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  {portalClient.address}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <button
              onClick={() => setActivePortalTab('MY_QUOTES')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5"
            >
              <span>Voir mes devis proformas demandés</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePortalTab('CATALOG')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Composer un nouveau devis
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <PortalAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={(client) => {
          setPortalClient(client);
        }}
        onRegisterSuccess={(client) => {
          setPortalClient(client);
        }}
        loginFunction={loginPortalClient}
        registerFunction={registerPortalClient}
        existingClients={clients}
      />
    </div>
  );
};
