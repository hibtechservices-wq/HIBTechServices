import { AppUser, UserRole, UserPermissions } from '../types';

export const defaultPermissionsByRole: Record<UserRole, UserPermissions> = {
  SUPER_ADMIN: {
    canAccessPOS: true,
    canCreateInvoices: true,
    canDeleteInvoices: true,
    canManageClients: true,
    canAccessDGI: true,
    canManageCatalog: true,
    canManageExpenses: true,
    canManageSettings: true,
    canManageUsers: true,
    canViewProfitMargins: true,
    canChangeExchangeRate: true,
    canReprintInvoices: true,
    canAccessAccounting: true,
  },
  MANAGER: {
    canAccessPOS: true,
    canCreateInvoices: true,
    canDeleteInvoices: false,
    canManageClients: true,
    canAccessDGI: true,
    canManageCatalog: true,
    canManageExpenses: true,
    canManageSettings: false,
    canManageUsers: false,
    canViewProfitMargins: true,
    canChangeExchangeRate: true,
    canReprintInvoices: true,
    canAccessAccounting: true,
  },
  CASHIER: {
    canAccessPOS: true,
    canCreateInvoices: true,
    canDeleteInvoices: false,
    canManageClients: true,
    canAccessDGI: false,
    canManageCatalog: false,
    canManageExpenses: false,
    canManageSettings: false,
    canManageUsers: false,
    canViewProfitMargins: false,
    canChangeExchangeRate: false,
    canReprintInvoices: false,
    canAccessAccounting: false,
  },
  ACCOUNTANT: {
    canAccessPOS: false,
    canCreateInvoices: true,
    canDeleteInvoices: false,
    canManageClients: true,
    canAccessDGI: true,
    canManageCatalog: false,
    canManageExpenses: true,
    canManageSettings: false,
    canManageUsers: false,
    canViewProfitMargins: true,
    canChangeExchangeRate: false,
    canReprintInvoices: true,
    canAccessAccounting: true,
  },
  STOCK_MANAGER: {
    canAccessPOS: false,
    canCreateInvoices: false,
    canDeleteInvoices: false,
    canManageClients: false,
    canAccessDGI: false,
    canManageCatalog: true,
    canManageExpenses: false,
    canManageSettings: false,
    canManageUsers: false,
    canViewProfitMargins: false,
    canChangeExchangeRate: false,
    canReprintInvoices: false,
    canAccessAccounting: false,
  },
};

export const initialUsers: AppUser[] = [
  {
    id: 'user-admin-1',
    name: 'Moïse Kabongo (Gérant)',
    email: 'hibtechservices@gmail.com',
    phone: '+243 81 234 5678',
    role: 'SUPER_ADMIN',
    pinCode: '1234',
    reprintPassword: '1234',
    isActive: true,
    assignedRegister: 'Bureau de Direction (Accès Total)',
    permissions: defaultPermissionsByRole.SUPER_ADMIN,
    lastLogin: '2026-10-03T09:10:00.000Z',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user-cashier-1',
    name: 'Rachel Mwamba (Caisse POS)',
    email: 'rachel.mwamba@congotech.cd',
    phone: '+243 85 999 1122',
    role: 'CASHIER',
    pinCode: '5678',
    reprintPassword: '5678',
    isActive: true,
    assignedRegister: 'Caisse Principale 1',
    permissions: defaultPermissionsByRole.CASHIER,
    lastLogin: '2026-10-03T08:30:00.000Z',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'user-compta-1',
    name: 'Didier Tshilenge (Comptable DGI)',
    email: 'compta@congotech.cd',
    phone: '+243 82 444 9900',
    role: 'ACCOUNTANT',
    pinCode: '9900',
    reprintPassword: '9900',
    isActive: true,
    assignedRegister: 'Département Comptabilité & Fiscalité DGI',
    permissions: defaultPermissionsByRole.ACCOUNTANT,
    lastLogin: '2026-10-02T16:00:00.000Z',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'user-stock-1',
    name: 'Christian Ilunga (Magasinier)',
    email: 'stock@congotech.cd',
    phone: '+243 99 876 5432',
    role: 'STOCK_MANAGER',
    pinCode: '4321',
    isActive: true,
    assignedRegister: 'Dépôt Central Limete',
    permissions: defaultPermissionsByRole.STOCK_MANAGER,
    lastLogin: '2026-10-03T07:45:00.000Z',
    createdAt: '2026-01-20T11:00:00.000Z',
  },
];

export function getRoleBadgeInfo(role: UserRole): { label: string; description: string; badgeClass: string } {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        label: 'Super Administrateur / Gérant',
        description: 'Accès illimité à tous les modules, finances, DGI et administration',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    case 'MANAGER':
      return {
        label: 'Responsable Commercial',
        description: 'Supervision des ventes, clients, créances et stocks',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'CASHIER':
      return {
        label: 'Caissier / Vendeur POS',
        description: 'Accès limité au Point de Vente, encaissements et tickets',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'ACCOUNTANT':
      return {
        label: 'Comptable / Déclarant DGI',
        description: 'Facturation, déclarations TVA, télétransmission DGI et charges',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'STOCK_MANAGER':
      return {
        label: 'Magasinier / Gestionnaire Stock',
        description: 'Catalogue produits, réapprovisionnement et alertes stocks',
        badgeClass: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      };
  }
}
