import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppUser, UserRole } from '../../types';
import { getRoleBadgeInfo } from '../../data/initialUsers';
import { UserModal } from './UserModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Key,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  FileText,
  DollarSign,
  Package,
  Receipt,
  Settings,
  ShieldAlert,
  ArrowRight,
  LogOut,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    deleteUser,
    updateUser,
    setIsUserSwitchModalOpen,
    logout,
  } = useApp();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  const togglePinVisibility = (userId: string) => {
    setShowPins((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCreateUser = () => {
    setSelectedUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setSelectedUserToEdit(user);
    setIsUserModalOpen(true);
  };

  const handleToggleStatus = (user: AppUser) => {
    if (user.id === currentUser.id) {
      return;
    }
    updateUser(user.id, { isActive: !user.isActive });
  };

  const handleDeleteUser = (user: AppUser) => {
    if (user.id === currentUser.id) {
      return;
    }
    setUserToDelete(user);
  };

  const handleFastSwitch = (user: AppUser) => {
    if (!user.isActive) {
      alert('Ce compte est actuellement verrouillé.');
      return;
    }
    setCurrentUser({
      ...user,
      lastLogin: new Date().toISOString(),
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery) ||
        (u.assignedRegister && u.assignedRegister.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = filterRole === 'ALL' || u.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const cashiersCount = users.filter((u) => u.role === 'CASHIER').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-900 text-amber-400 border border-neutral-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Contrôle d'Accès & Sécurité RBAC</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-200 text-neutral-800">
              {activeUsers} actif(s) sur {totalUsers}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Gestion des Utilisateurs & Autorisations
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Gérez les comptes employés, l'affectation aux caisses de vente, les codes PIN et les autorisations granulaires.
          </p>
        </div>

        {/* Action Buttons on single line under the title */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setIsUserSwitchModalOpen(true)}
            className="h-8 px-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Changer de Caisse</span>
          </button>

          <button
            onClick={logout}
            className="h-8 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
            title="Verrouiller l'écran et se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Se Déconnecter</span>
          </button>

          <button
            onClick={handleCreateUser}
            className="h-8 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Nouvel Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Active User Alert Card */}
      <div className="bg-neutral-900 text-white p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-neutral-950 font-bold text-lg flex items-center justify-center shadow-inner">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-white">{currentUser.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {getRoleBadgeInfo(currentUser.role).label}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Affectation : <span className="text-neutral-200">{currentUser.assignedRegister || 'Administration'}</span> · Email : <span className="text-neutral-200">{currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-[11px] text-neutral-400 font-mono-nums">
            Code PIN actif : <strong className="text-amber-400">••••</strong>
          </span>
          <button
            onClick={() => handleEditUser(currentUser)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors border border-neutral-700"
          >
            Modifier mon Profil
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Rechercher par nom, email, caisse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
          />
        </div>

        {/* Role filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'SUPER_ADMIN', label: 'Administrateurs' },
            { id: 'CASHIER', label: 'Caissiers POS' },
            { id: 'ACCOUNTANT', label: 'Comptables DGI' },
            { id: 'STOCK_MANAGER', label: 'Magasiniers' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setFilterRole(r.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterRole === r.id
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 text-neutral-700 uppercase font-semibold text-[10px] border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Utilisateur & Contact</th>
                <th className="py-3.5 px-4">Rôle & Profil</th>
                <th className="py-3.5 px-4">Affectation / Caisse</th>
                <th className="py-3.5 px-4">Code PIN & Pass Réimpr</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleBadgeInfo(user.role);
                const isCurrent = user.id === currentUser.id;
                const isPinVisible = Boolean(showPins[user.id]);
                const grantedPermsCount = Object.values(user.permissions || {}).filter(Boolean).length;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      isCurrent ? 'bg-amber-50/30 font-medium' : ''
                    }`}
                  >
                    {/* User & Contact */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                            isCurrent
                              ? 'bg-neutral-900 text-amber-400 ring-2 ring-amber-400'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-neutral-900 text-xs truncate">
                              {user.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-bold">
                                En cours
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-neutral-500 truncate">
                            {user.email} · {user.phone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${roleInfo.badgeClass}`}
                      >
                        {roleInfo.label}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {user.permissions?.canCreateInvoices || user.role === 'SUPER_ADMIN' || user.role === 'CASHIER' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Autorisé à facturer</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded-full">
                            <span>Facturation bloquée</span>
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400">
                          ({grantedPermsCount} droits)
                        </span>
                      </div>
                    </td>

                    {/* Assigned register */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-neutral-800">
                        <Store className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-medium text-xs">
                          {user.assignedRegister || 'Non affecté'}
                        </span>
                      </div>
                    </td>

                    {/* PIN Code & Reprint Password */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-mono-nums">
                          <span className="text-[10px] text-neutral-400 font-sans">PIN :</span>
                          <span className="font-bold text-xs bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                            {isPinVisible ? user.pinCode : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(user.id)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
                            title={isPinVisible ? 'Masquer' : 'Afficher'}
                          >
                            {isPinVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          {user.reprintPassword ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono font-semibold"
                              title="Mot de passe réimpression configuré dans Utilisateurs & Droits"
                            >
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Réimpr: {isPinVisible ? user.reprintPassword : '••••'}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic text-[10px]">
                              Pass réimpr non défini
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                        title="Cliquer pour activer/verrouiller ce compte"
                      >
                        {user.isActive ? (
                          <>
                            <Unlock className="w-2.5 h-2.5" />
                            <span>Actif</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" />
                            <span>Verrouillé</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isCurrent && user.isActive && (
                          <button
                            type="button"
                            onClick={() => handleFastSwitch(user)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[11px] font-semibold transition-colors"
                            title="Bascule immédiate vers cette session"
                          >
                            Utiliser
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors"
                          title="Modifier le compte et les droits"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md transition-colors"
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Reference Table */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Matrice des Rôles & Niveaux de Responsabilité Commerciale
            </h2>
            <p className="text-xs text-neutral-500">
              Aperçu des accès prédéfinis pour sécuriser vos opérations de vente et vos déclarations fiscales DGI.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <h3 className="font-bold text-neutral-900">Gérant / Super Admin</h3>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Supervision totale de l'entreprise : chiffre d'affaires, marges bénéficiaires nettes, réinitialisation de base, gestion des utilisateurs et modification du taux de change officiel USD/CDF.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="font-bold text-neutral-900">Caissier / Vendeur POS</h3>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Dédié à la vitesse de vente en caisse : encaissements en dollars, francs congolais et Mobile Money (M-Pesa, Orange, Airtel), émission de tickets de caisse normalisés DGI avec QR code.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h3 className="font-bold text-neutral-900">Comptable / Déclarant DGI</h3>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Gestion de la conformité fiscale : suivi de la TVA collectée 16%, télétransmission vers la passerelle API DGI, bordereaux mensuels de déclaration et imputation des charges déductibles.
            </p>
          </div>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUserToEdit(null);
        }}
        userToEdit={selectedUserToEdit}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(userToDelete)}
        title="Supprimer l'utilisateur ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le compte utilisateur de "${userToDelete?.name}" ?`}
        details={userToDelete ? `Rôle: ${userToDelete.role} · Email: ${userToDelete.email}` : ''}
        confirmText="Supprimer"
        onConfirm={() => {
          if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
