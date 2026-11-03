import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AppUser, UserRole, UserPermissions } from '../../types';
import { defaultPermissionsByRole, getRoleBadgeInfo } from '../../data/initialUsers';
import { User, ShieldCheck, X, Check, Key, Lock, Phone, Mail, Eye, EyeOff } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: AppUser | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, userToEdit }) => {
  const { addUser, updateUser } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+243 ');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [pinCode, setPinCode] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [reprintPassword, setReprintPassword] = useState('');
  const [showReprintPassword, setShowReprintPassword] = useState(false);
  const [assignedRegister, setAssignedRegister] = useState('Caisse Principale 1');
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissionsByRole.CASHIER);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone);
      setRole(userToEdit.role);
      setPinCode(userToEdit.pinCode);
      setReprintPassword(userToEdit.reprintPassword || '');
      setAssignedRegister(userToEdit.assignedRegister || '');
      setIsActive(userToEdit.isActive);
      setPermissions(userToEdit.permissions || defaultPermissionsByRole[userToEdit.role]);
    } else {
      setName('');
      setEmail('');
      setPhone('+243 ');
      setRole('CASHIER');
      setPinCode(Math.floor(1000 + Math.random() * 9000).toString());
      setReprintPassword('1234');
      setAssignedRegister('Caisse Showroom');
      setIsActive(true);
      setPermissions(defaultPermissionsByRole.CASHIER);
    }
  }, [userToEdit, isOpen]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPermissions(defaultPermissionsByRole[newRole]);
  };

  const handlePermissionToggle = (permKey: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [permKey]: !prev[permKey],
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (userToEdit) {
      updateUser(userToEdit.id, {
        name,
        email,
        phone,
        role,
        pinCode,
        reprintPassword: reprintPassword.trim() || undefined,
        assignedRegister,
        isActive,
        permissions,
      });
    } else {
      addUser({
        name,
        email,
        phone,
        role,
        pinCode,
        reprintPassword: reprintPassword.trim() || undefined,
        assignedRegister,
        isActive,
        permissions,
      });
    }

    onClose();
  };

  const roleList: { role: UserRole; title: string }[] = [
    { role: 'SUPER_ADMIN', title: 'Super Administrateur / Gérant' },
    { role: 'MANAGER', title: 'Responsable Commercial / Superviseur' },
    { role: 'CASHIER', title: 'Caissier / Agent de Vente POS' },
    { role: 'ACCOUNTANT', title: 'Comptable / Déclarant DGI' },
    { role: 'STOCK_MANAGER', title: 'Magasinier / Gestionnaire de Stock' },
  ];

  const permissionLabels: { key: keyof UserPermissions; label: string; desc: string }[] = [
    { key: 'canAccessPOS', label: 'Accéder à la Caisse Express (POS)', desc: 'Effectuer des ventes rapides, encaisser et imprimer tickets' },
    { key: 'canReprintInvoices', label: 'Autoriser Réimpression Factures & Tickets POS', desc: 'Permet d\'autoriser la réimpression de tickets de caisse avec son mot de passe' },
    { key: 'canCreateInvoices', label: 'Créer Factures & Devis Proforma', desc: 'Émettre des documents commerciaux' },
    { key: 'canDeleteInvoices', label: 'Supprimer / Annuler des Factures', desc: 'Autorisation critique avec réajustement de stock' },
    { key: 'canManageClients', label: 'Gérer les Clients & Créances', desc: 'Créer clients, relancer par WhatsApp et enregistrer règlements' },
    { key: 'canAccessDGI', label: 'Accéder au module DGI & TVA', desc: 'Télédéclarations fiscales et bordereau mensuel TVA' },
    { key: 'canManageCatalog', label: 'Gérer Catalogue & Réapprovisionnement', desc: 'Ajouter/modifier produits, prix et ajuster stocks' },
    { key: 'canManageExpenses', label: 'Enregistrer & Gérer les Dépenses', desc: 'Suivi des charges d\'exploitation' },
    { key: 'canManageSettings', label: 'Modifier les Paramètres Entreprise', desc: 'Coordonnées bancaires, légal et mentions' },
    { key: 'canManageUsers', label: 'Gérer les Utilisateurs & Droits', desc: 'Créer comptes, modifier rôles et codes PIN' },
    { key: 'canViewProfitMargins', label: 'Visualiser les Marges & Bénéfices', desc: 'Coûts de revient et bénéfice net' },
    { key: 'canChangeExchangeRate', label: 'Modifier le Taux de Change USD/CDF', desc: 'Ajuster le taux de conversion du jour' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">
                {userToEdit ? `Modifier le Compte : ${userToEdit.name}` : 'Créer un Nouvel Utilisateur'}
              </h3>
              <p className="text-xs text-neutral-400">
                Attribution des rôles et contrôle granulaire des autorisations d'accès
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Rôle Principal & Profil
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roleList.map((r) => {
                const info = getRoleBadgeInfo(r.role);
                const isSelected = role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleRoleChange(r.role)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs ring-1 ring-neutral-900'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{r.title}</span>
                      <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {info.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Nom & Prénom de l'Employé *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Rachel Mwamba"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Email Professionnel *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rachel@congotech.cd"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Téléphone (RDC)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 85 999 1122"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none font-mono-nums text-xs"
              />
            </div>
          </div>

          {/* PIN Code & Reprint Password & Assigned Register */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Code PIN Rapide (Bascule de session) *
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-8 pr-9 py-2 bg-neutral-50 border border-neutral-300 rounded-lg font-mono-nums font-bold text-base text-neutral-900 focus:outline-none focus:bg-white"
                  required
                />
                <Key className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  title={showPin ? 'Masquer le code PIN' : 'Afficher le code PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">Permet l'accès rapide sur écran tactile</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Mot de Passe Réimpression Facture (POS)</span>
              </label>
              <div className="relative">
                <input
                  type={showReprintPassword ? 'text' : 'password'}
                  value={reprintPassword}
                  onChange={(e) => setReprintPassword(e.target.value)}
                  placeholder="Ex: 1234 ou Superviseur2026"
                  className="w-full pl-8 pr-9 py-2 bg-amber-50/40 border border-amber-300 rounded-lg font-mono font-bold text-sm text-neutral-900 focus:outline-none focus:bg-white focus:border-amber-500"
                />
                <Lock className="w-4 h-4 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowReprintPassword(!showReprintPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  title={showReprintPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showReprintPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-amber-700 mt-0.5 block font-medium">
                Exigé à la caisse POS pour autoriser la réimpression d'une facture/ticket
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Affectation Caisse / Dépôt
              </label>
              <input
                type="text"
                value={assignedRegister}
                onChange={(e) => setAssignedRegister(e.target.value)}
                placeholder="Ex: Caisse 1 Showroom"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Statut du Compte
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full py-2 px-3 rounded-lg border font-semibold text-xs flex items-center justify-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                <span>{isActive ? 'Compte Actif (Autorisé)' : 'Compte Verrouillé (Bloqué)'}</span>
              </button>
            </div>
          </div>

          {/* Granular Permissions Checkbox Matrix */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autorisations & Permissions Granulaires</span>
              </span>
              <span className="text-[11px] text-neutral-500">
                Personnalisable indépendamment du profil par défaut
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {permissionLabels.map((perm) => {
                const isChecked = Boolean(permissions[perm.key]);
                return (
                  <label
                    key={perm.key}
                    onClick={() => handlePermissionToggle(perm.key)}
                    className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        : 'bg-white border-neutral-200 text-neutral-400 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 accent-neutral-900 rounded mt-0.5"
                    />
                    <div className="text-xs">
                      <span className="font-semibold block text-neutral-900">{perm.label}</span>
                      <span className="text-[10px] text-neutral-500 leading-tight block mt-0.5">{perm.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>{userToEdit ? 'Enregistrer les Modifications' : 'Créer le Compte Utilisateur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
