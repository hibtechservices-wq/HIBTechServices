import React, { useState } from 'react';
import { Client } from '../../types';
import {
  UserPlus,
  LogIn,
  X,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortalAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (client: Client) => void;
  onRegisterSuccess: (client: Client) => void;
  loginFunction: (identifier: string, password?: string) => { success: boolean; client?: Client; message?: string };
  registerFunction: (data: Omit<Client, 'id' | 'totalSpentUSD' | 'outstandingDebtUSD' | 'createdAt'>) => Client;
  existingClients: Client[];
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const PortalAuthModal: React.FC<PortalAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
  loginFunction,
  registerFunction,
  existingClients,
  initialMode = 'REGISTER',
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'COMPANY'>('COMPANY');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('+243 ');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lubumbashi');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [nif, setNif] = useState('');
  const [rccm, setRccm] = useState('');
  const [password, setPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Veuillez saisir votre numéro de téléphone ou votre adresse email.');
      return;
    }

    const res = loginFunction(loginIdentifier, loginPassword);
    if (!res.success || !res.client) {
      setLoginError(res.message || 'Identifiants invalides.');
      return;
    }

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    onLoginSuccess(res.client);
    onClose();
  };

  const handleDemoLogin = (client: Client) => {
    onLoginSuccess(client);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!name.trim()) {
      setRegisterError('Veuillez renseigner votre nom complet ou le nom du contact.');
      return;
    }

    if (clientType === 'COMPANY' && !companyName.trim()) {
      setRegisterError("Veuillez renseigner la raison sociale de l'entreprise.");
      return;
    }

    if (!phone.trim() || phone.trim() === '+243') {
      setRegisterError('Veuillez renseigner un numéro de téléphone valide pour le suivi de votre devis.');
      return;
    }

    const finalName = name.trim();
    const finalCompany = clientType === 'COMPANY' ? companyName.trim() : undefined;
    const finalPhone = phone.trim();

    try {
      const created = registerFunction({
        name: finalName,
        companyName: finalCompany,
        type: clientType,
        phone: finalPhone,
        whatsapp: whatsapp.trim() || finalPhone,
        email: email.trim() || undefined,
        city: city.trim() || 'Lubumbashi',
        commune: commune.trim() || undefined,
        address: address.trim() || undefined,
        nif: nif.trim() || undefined,
        rccmOrNif: rccm.trim() || undefined,
        isVatSubject: clientType === 'COMPANY',
        password: password.trim() || 'client123',
        isRegisteredOnPortal: true,
      });

      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}

      onRegisterSuccess(created);
      onClose();
    } catch (err: any) {
      setRegisterError(err.message || 'Une erreur est survenue lors de la création de votre compte.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header Tabs */}
        <div className="border-b border-neutral-200 bg-neutral-50 px-5 pt-4 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setLoginError(null);
                setRegisterError(null);
              }}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                mode === 'REGISTER'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un Compte Client</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setLoginError(null);
                setRegisterError(null);
              }}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                mode === 'LOGIN'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Se Connecter</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors -mt-2"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {mode === 'REGISTER' ? (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="text-center sm:text-left space-y-1 pb-1">
                <h3 className="text-base font-bold text-neutral-900">
                  Création de votre Espace Client
                </h3>
                <p className="text-xs text-neutral-500">
                  Créez votre compte en 1 minute pour enregistrer vos coordonnées fiscales et générer vos devis proforma conformes DGI.
                </p>
              </div>

              {registerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{registerError}</span>
                </div>
              )}

              {/* Client Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Type de Client
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClientType('COMPANY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      clientType === 'COMPANY'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-2xs'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Entreprise / Société</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClientType('INDIVIDUAL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      clientType === 'INDIVIDUAL'
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 shadow-2xs'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Particulier / Professionnel</span>
                  </button>
                </div>
              </div>

              {/* Company Name if applicable */}
              {clientType === 'COMPANY' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Raison Sociale de l'Entreprise <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ex: Vodacom RDC SA, Cabinet Juridique, etc."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Contact Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {clientType === 'COMPANY' ? 'Nom du Représentant / Responsable Achats' : 'Nom Complet'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Serge Kasongo"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Téléphone (RDC) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+243 81 234 5678"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email de contact
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="achats@societe.cd"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Location: City & Commune */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Ville
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="Lubumbashi">Lubumbashi (Haut-Katanga)</option>
                    <option value="Kolwezi">Kolwezi (Lualaba)</option>
                    <option value="Likasi">Likasi</option>
                    <option value="Goma">Goma (Nord-Kivu)</option>
                    <option value="Bukavu">Bukavu (Sud-Kivu)</option>
                    <option value="Kinshasa">Kinshasa</option>
                    <option value="Matadi">Matadi</option>
                    <option value="Autre RDC">Autre province RDC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Commune / Quartier
                  </label>
                  <input
                    type="text"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="ex: Quartier / Commune..."
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Adresse physique complète
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ex: 15, Boulevard du 30 Juin"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Fiscal Identification for Companies */}
              {clientType === 'COMPANY' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Numéro Impôt (NIF)
                    </label>
                    <input
                      type="text"
                      value={nif}
                      onChange={(e) => setNif(e.target.value)}
                      placeholder="ex: A2109845B"
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg font-mono uppercase bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Numéro RCCM
                    </label>
                    <input
                      type="text"
                      value={rccm}
                      onChange={(e) => setRccm(e.target.value)}
                      placeholder="ex: CD/KIN/RCCM/21-B-..."
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg font-mono uppercase bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Mot de Passe de connexion
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choisissez un mot de passe sécurisé"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Créer mon Compte & Accéder au Portail</span>
              </button>
            </form>
          ) : (
            /* ================= LOGIN FORM ================= */
            <div className="space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="text-center sm:text-left space-y-1 pb-1">
                  <h3 className="text-base font-bold text-neutral-900">
                    Connexion à votre Espace Client
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Saisissez votre numéro de téléphone ou email pour retrouver votre profil et vos devis proforma enregistrés.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Téléphone ou Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="+243 81... ou email@societe.cd"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      className="w-full pl-9 pr-10 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm hover:shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Se Connecter</span>
                </button>
              </form>

              {/* Quick Demo Accounts Selection */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Ou connexion rapide en 1-clic (Comptes Démo) :
                </span>
                <div className="space-y-1.5">
                  {existingClients.slice(0, 3).map((cli) => (
                    <button
                      key={cli.id}
                      type="button"
                      onClick={() => handleDemoLogin(cli)}
                      className="w-full text-left p-2.5 bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 rounded-xl text-xs transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-neutral-800 group-hover:text-emerald-800">
                          {cli.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {cli.companyName ? `${cli.companyName} • ` : ''}{cli.phone}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
