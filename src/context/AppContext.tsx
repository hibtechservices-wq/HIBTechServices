import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ProductOrService,
  Client,
  Sale,
  SaleStatus,
  Expense,
  CompanySettings,
  Currency,
  PaymentMethod,
  SaleItem,
  DocumentType,
  PaymentEntry,
  DgiVatBreakdown,
  FiscalTaxGroup,
  AppUser,
  UserPermissions,
  UserRole,
  NetworkEquipment,
  CashRegisterSession,
  StockMovement,
  StockPurchase,
  StockPurchaseItem,
  AuditLogEntry,
  AuditActionType,
  WipeDataOptions,
  PortalCartItem,
  DeliveryNote,
  WorkOrder,
  WorkOrderType,
  SubscriptionContract,
  PricingTier,
  CashBilletageUSD,
  CashBilletageCDF,
  AccountingEntry,
} from '../types';
import {
  initialCompanySettings,
  initialProductsAndServices,
  initialClients,
  initialSales,
  initialExpenses,
  initialCashSessions,
  initialStockPurchases,
  initialStockMovements,
  initialAuditLogs,
} from '../data/initialData';
import { initialUsers, defaultPermissionsByRole } from '../data/initialUsers';
import { initialEquipments } from '../data/initialEquipments';
import {
  initialDeliveryNotes,
  initialWorkOrders,
  initialSubscriptions,
} from '../data/initialOperationsData';
import { generateDgiSecurityCode, generateDgiQrPayload } from '../utils/formatters';
import { generateCashPaidStampSvg } from '../utils/stampGenerator';

interface CartItem extends SaleItem {
  maxStock?: number;
}

interface AppContextType {
  // Data
  products: ProductOrService[];
  clients: Client[];
  sales: Sale[];
  expenses: Expense[];
  settings: CompanySettings;
  users: AppUser[];
  currentUser: AppUser;
  isSessionLocked: boolean;
  
  // User Authentication & Permissions
  setCurrentUser: (user: AppUser) => void;
  switchUserByPin: (pin: string, targetUserId?: string) => { success: boolean; user?: AppUser; message?: string };
  addUser: (userData: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, userData: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  lockSession: () => void;
  logout: () => void;
  unlockSession: (user: AppUser, pin?: string) => { success: boolean; message?: string };

  // Navigation & UI View
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  selectedCurrency: Currency;
  setSelectedCurrency: (curr: Currency) => void;
  
  // Rate changer
  updateExchangeRate: (newRate: number) => void;
  updateSettings: (newSettings: CompanySettings) => void;

  // Catalog Actions
  addProductOrService: (item: Omit<ProductOrService, 'id' | 'createdAt'>) => void;
  updateProductOrService: (id: string, item: Partial<ProductOrService>) => void;
  deleteProductOrService: (id: string) => void;
  adjustStock: (id: string, deltaQty: number) => void;

  // Client Actions
  addClient: (client: Omit<Client, 'id' | 'totalSpentUSD' | 'outstandingDebtUSD' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Sales & Invoices Actions
  createSale: (saleData: {
    type: DocumentType;
    clientId: string;
    items: SaleItem[];
    discountUSD: number;
    taxPercent: number;
    amountPaidUSD: number;
    paymentMethod: PaymentMethod;
    dueDate?: string;
    notes?: string;
    customDate?: string;
    clientName?: string;
    clientPhone?: string;
    clientAddress?: string;
    clientNif?: string;
    cashierName?: string;
    isNormalizedDGI?: boolean;
    dgiExemptionReason?: string;
  }) => Sale;
  recordPayment: (saleId: string, payment: {
    amountUSD: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }) => void;
  updateSale: (saleId: string, updatedData: {
    type?: DocumentType;
    clientId?: string;
    items?: SaleItem[];
    discountUSD?: number;
    taxPercent?: number;
    amountPaidUSD?: number;
    paymentMethod?: PaymentMethod;
    dueDate?: string;
    notes?: string;
    clientNif?: string;
    isNormalizedDGI?: boolean;
    dgiExemptionReason?: string;
  }) => void;
  convertQuoteToInvoice: (saleId: string) => void;
  deleteSale: (saleId: string) => void;

  // Expense Actions
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Equipment & Network Config Actions
  equipments: NetworkEquipment[];
  addEquipment: (equipmentData: Omit<NetworkEquipment, 'id' | 'createdAt' | 'updatedAt'>) => NetworkEquipment;
  updateEquipment: (id: string, equipmentData: Partial<NetworkEquipment>) => void;
  deleteEquipment: (id: string) => void;
  activePrintEquipment: NetworkEquipment | null;
  setActivePrintEquipment: (equipment: NetworkEquipment | null) => void;

  // 1. Bons de Livraison (BL) & Décharges Matériel
  deliveryNotes: DeliveryNote[];
  addDeliveryNote: (note: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>) => DeliveryNote;
  updateDeliveryNote: (id: string, note: Partial<DeliveryNote>) => void;
  deleteDeliveryNote: (id: string) => void;

  // 2. Ordres de Mission & Interventions Techniques Terrain
  workOrders: WorkOrder[];
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>) => WorkOrder;
  updateWorkOrder: (id: string, order: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;

  // 3. Abonnements & Contrats de Maintenance SAV
  subscriptions: SubscriptionContract[];
  addSubscription: (sub: Omit<SubscriptionContract, 'id' | 'createdAt' | 'updatedAt'>) => SubscriptionContract;
  updateSubscription: (id: string, sub: Partial<SubscriptionContract>) => void;
  deleteSubscription: (id: string) => void;
  renewSubscription: (id: string, monthsToAdd?: number) => void;
  generateSubscriptionInvoice: (subscriptionId: string) => Sale | null;

  // Print & WhatsApp Modals triggers
  activePrintSale: Sale | null;
  setActivePrintSale: (sale: Sale | null) => void;
  activeWhatsAppClient: { client: Client; sale: Sale | null } | null;
  setActiveWhatsAppClient: (payload: { client: Client; sale: Sale | null } | null) => void;

  // Quick switch modal
  isUserSwitchModalOpen: boolean;
  setIsUserSwitchModalOpen: (open: boolean) => void;

  // Data wipe & reset modal
  isDataWipeModalOpen: boolean;
  setIsDataWipeModalOpen: (open: boolean) => void;

  // Cart / POS state & Multi-Tier Pricing
  cart: CartItem[];
  posPricingTier: PricingTier;
  setPosPricingTier: (tier: PricingTier) => void;
  addToCart: (item: ProductOrService, qty?: number, customUnitPrice?: number) => void;
  updateCartItemUnitPrice: (itemId: string, newUnitPrice: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;

  // Cash Register Sessions & Closures (Rapports Z & X avec Billetage)
  cashSessions: CashRegisterSession[];
  currentCashSession: CashRegisterSession | null;
  openCashSession: (data: {
    openingFloatUSD: number;
    openingFloatCDF: number;
    cashierName?: string;
    supervisorName?: string;
  }) => CashRegisterSession;
  closeCashSession: (data: {
    countedUSD: number;
    countedCDF: number;
    notes?: string;
    supervisorName?: string;
    billetageUSD?: CashBilletageUSD;
    billetageCDF?: CashBilletageCDF;
    reportType?: 'Z' | 'X';
  }) => CashRegisterSession;
  generateInterimReportX: (data?: {
    countedUSD?: number;
    countedCDF?: number;
    notes?: string;
    billetageUSD?: CashBilletageUSD;
    billetageCDF?: CashBilletageCDF;
  }) => CashRegisterSession | null;
  deleteCashSession: (sessionId: string) => void;
  togglePaymentReconciliation: (paymentId: string) => void;

  // Demande de Dépannage SAV en Ligne (Portail Client)
  createPortalWorkOrderTicket: (ticket: {
    title: string;
    type: WorkOrderType;
    siteName: string;
    siteAddress?: string;
    notes: string;
    priority?: 'NORMAL' | 'URGENT' | 'CRITICAL';
  }) => WorkOrder;

  // Stock Purchases & Movements Actions
  stockPurchases: StockPurchase[];
  stockMovements: StockMovement[];
  recordStockPurchase: (purchaseData: {
    supplierName: string;
    supplierPhone?: string;
    blReference?: string;
    items: { productId: string; quantity: number; unitCostUSD: number }[];
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => StockPurchase;
  recordStockMovement: (movement: Omit<StockMovement, 'id' | 'date'>) => void;

  // Audit Trail & Security Logs
  auditLogs: AuditLogEntry[];
  recordAuditLog: (entry: {
    action: AuditActionType;
    title: string;
    details: string;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  }) => void;

  // Backup, Reset & Data Deletion
  resetToDemoData: () => void;
  wipeData: (options: WipeDataOptions) => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonData: string) => boolean;

  // Computed metrics
  metrics: {
    totalRevenueUSD: number;
    totalRevenueCDF: number;
    totalCollectedUSD: number;
    totalDebtsUSD: number;
    totalExpensesUSD: number;
    netProfitUSD: number;
    grossMarginUSD: number;
    grossMarginPercent: number;
    todayRevenueUSD: number;
    todayRevenueCDF: number;
    monthRevenueUSD: number;
    monthRevenueCDF: number;
    monthExpensesUSD: number;
    overdueDebtsUSD: number;
    productsCount: number;
    servicesCount: number;
    lowStockCount: number;
    unpaidInvoicesCount: number;
    totalTvaCollectedUSD: number;
    totalTvaCollectedCDF: number;
    totalTaxableBaseUSD: number;
    normalizedInvoicesCount: number;
  };

  // Customer Portal (Portail Client & Devis Proforma en ligne)
  portalClient: Client | null;
  setPortalClient: (client: Client | null) => void;
  portalCart: PortalCartItem[];
  addToPortalCart: (item: ProductOrService, quantity?: number) => void;
  updatePortalCartQuantity: (itemId: string, quantity: number) => void;
  removeFromPortalCart: (itemId: string) => void;
  clearPortalCart: () => void;
  loginPortalClient: (identifier: string, password?: string) => { success: boolean; client?: Client; message?: string };
  registerPortalClient: (clientData: Omit<Client, 'id' | 'totalSpentUSD' | 'outstandingDebtUSD' | 'createdAt'>) => Client;
  logoutPortalClient: () => void;
  createPortalProforma: (params: {
    notes?: string;
    validityDays?: number;
    isVatActive?: boolean;
    customDiscountUSD?: number;
    guestName?: string;
    guestCompany?: string;
    guestPhone?: string;
  }) => Sale | null;

  // Global Notification Toast
  notification: { message: string; type: 'success' | 'info' | 'error' } | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearNotification: () => void;

  // Comptabilité SYSCOHADA (RDC)
  customAccountingEntries: AccountingEntry[];
  addAccountingEntry: (entry: Omit<AccountingEntry, 'id' | 'createdAt'>) => AccountingEntry;
  deleteAccountingEntry: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PRODUCTS = 'congobiz_products_v4';
const STORAGE_KEY_CLIENTS = 'congobiz_clients_v4';
const STORAGE_KEY_ACCOUNTING_ENTRIES = 'congobiz_accounting_entries_v4';
const STORAGE_KEY_SALES = 'congobiz_sales_v4';
const STORAGE_KEY_EXPENSES = 'congobiz_expenses_v4';
const STORAGE_KEY_SETTINGS = 'congobiz_settings_v4';
const STORAGE_KEY_USERS = 'congobiz_users_v4';
const STORAGE_KEY_CURRENT_USER = 'congobiz_current_user_v4';
const STORAGE_KEY_PORTAL_CLIENT = 'congobiz_portal_client_v4';
const STORAGE_KEY_PORTAL_CART = 'congobiz_portal_cart_v4';
const STORAGE_KEY_EQUIPMENTS = 'congobiz_equipments_v4';
const STORAGE_KEY_DELIVERY_NOTES = 'congobiz_delivery_notes_v4';
const STORAGE_KEY_WORK_ORDERS = 'congobiz_work_orders_v4';
const STORAGE_KEY_SUBSCRIPTIONS = 'congobiz_subscriptions_v4';
const STORAGE_KEY_CASH_SESSIONS = 'congobiz_cash_sessions_v4';
const STORAGE_KEY_STOCK_PURCHASES = 'congobiz_stock_purchases_v4';
const STORAGE_KEY_STOCK_MOVEMENTS = 'congobiz_stock_movements_v4';
const STORAGE_KEY_AUDIT_LOGS = 'congobiz_audit_logs_v4';
const STORAGE_KEY_SESSION_LOCKED = 'congobiz_session_locked_v4';
const STORAGE_KEY_ACTIVE_TAB = 'congobiz_active_tab_v4';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<ProductOrService[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    return saved ? JSON.parse(saved) : initialProductsAndServices;
  });

  const [equipments, setEquipments] = useState<NetworkEquipment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EQUIPMENTS);
    return saved ? JSON.parse(saved) : initialEquipments;
  });

  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DELIVERY_NOTES);
    return saved ? JSON.parse(saved) : initialDeliveryNotes;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORK_ORDERS);
    return saved ? JSON.parse(saved) : initialWorkOrders;
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionContract[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    return saved ? JSON.parse(saved) : initialSubscriptions;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SALES);
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.city || parsed.city.toLowerCase().includes('kinshasa')) {
          parsed.city = 'Lubumbashi';
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
        }
        if (parsed.dgiCenter && parsed.dgiCenter.toLowerCase().includes('kinshasa')) {
          parsed.dgiCenter = 'Centre des Impôts (CDI) Lubumbashi';
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
        }
        // Regenerate cashPaidStampUrl if missing or if it still has the smaller legacy dimensions
        if (!parsed.cashPaidStampUrl || (typeof parsed.cashPaidStampUrl === 'string' && parsed.cashPaidStampUrl.includes('260%20120'))) {
          parsed.cashPaidStampUrl = generateCashPaidStampSvg(parsed.name || initialCompanySettings.name, parsed.cashierName || initialCompanySettings.cashierName);
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {}
    }
    return initialCompanySettings;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialUsers[0];
  });

  // Cash Register Sessions
  const [cashSessions, setCashSessions] = useState<CashRegisterSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CASH_SESSIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (s: any) => s.id !== 'session-default-today' && s.sessionNumber !== 'CS-20261007-01'
          );
          return cleaned;
        }
      } catch (e) {}
    }
    return initialCashSessions;
  });

  // Approvisionnements & Mouvements de stock
  const [stockPurchases, setStockPurchases] = useState<StockPurchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STOCK_PURCHASES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialStockPurchases;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STOCK_MOVEMENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialStockMovements;
  });

  // Audit Trail & Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialAuditLogs;
  });

  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSION_LOCKED);
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Verrouillé par défaut au premier accès
  });

  // L'Espace Client est toujours le premier écran affiché au lancement de l'application
  const [activeTab, setActiveTab] = useState<string>('portal');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(settings.displayCurrency || 'USD');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posPricingTier, setPosPricingTier] = useState<PricingTier>('RETAIL');

  // Modals controllers
  const [activePrintSale, setActivePrintSale] = useState<Sale | null>(null);
  const [activePrintEquipment, setActivePrintEquipment] = useState<NetworkEquipment | null>(null);
  const [activeWhatsAppClient, setActiveWhatsAppClient] = useState<{ client: Client; sale: Sale | null } | null>(null);
  const [isUserSwitchModalOpen, setIsUserSwitchModalOpen] = useState<boolean>(false);
  const [isDataWipeModalOpen, setIsDataWipeModalOpen] = useState<boolean>(false);

  // Global Toast Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
  };
  const clearNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  // Customer Portal (Portail Client en ligne) State
  const [portalClient, setPortalClient] = useState<Client | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PORTAL_CLIENT);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [portalCart, setPortalCart] = useState<PortalCartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PORTAL_CART);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (portalClient) {
      localStorage.setItem(STORAGE_KEY_PORTAL_CLIENT, JSON.stringify(portalClient));
    } else {
      localStorage.removeItem(STORAGE_KEY_PORTAL_CLIENT);
    }
  }, [portalClient]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PORTAL_CART, JSON.stringify(portalCart));
  }, [portalCart]);

  const [customAccountingEntries, setCustomAccountingEntries] = useState<AccountingEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTING_ENTRIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACCOUNTING_ENTRIES, JSON.stringify(customAccountingEntries));
  }, [customAccountingEntries]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EQUIPMENTS, JSON.stringify(equipments));
  }, [equipments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DELIVERY_NOTES, JSON.stringify(deliveryNotes));
  }, [deliveryNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORK_ORDERS, JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CASH_SESSIONS, JSON.stringify(cashSessions));
  }, [cashSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STOCK_PURCHASES, JSON.stringify(stockPurchases));
  }, [stockPurchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STOCK_MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SESSION_LOCKED, isSessionLocked ? 'true' : 'false');
  }, [isSessionLocked]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Permissions check helper
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return Boolean(currentUser.permissions?.[permission]);
  };

  // Lock and Logout handlers - Explicitly locks until unlock and redirects to public portal
  const lockSession = () => {
    setIsSessionLocked(true);
    localStorage.setItem(STORAGE_KEY_SESSION_LOCKED, 'true');
    setActiveTab('portal');
  };

  const logout = () => {
    setIsSessionLocked(true);
    localStorage.setItem(STORAGE_KEY_SESSION_LOCKED, 'true');
    setActiveTab('portal');
  };

  const unlockSession = (user: AppUser, pin?: string): { success: boolean; message?: string } => {
    if (!user.isActive) {
      return { success: false, message: 'Ce compte utilisateur est actuellement verrouillé.' };
    }
    if (pin !== undefined && user.pinCode !== pin) {
      return { success: false, message: 'Code PIN incorrect. Veuillez réessayer.' };
    }
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setIsSessionLocked(false);
    localStorage.setItem(STORAGE_KEY_SESSION_LOCKED, 'false');

    // Garde la page active en cours; redirige seulement si l'onglet courant est interdit
    const cashierRestrictedTabs = ['dgi', 'expenses', 'users', 'settings'];
    if (updatedUser.role === 'CASHIER' && cashierRestrictedTabs.includes(activeTab)) {
      setActiveTab('pos');
    }

    return { success: true };
  };

  // Switch user by PIN
  const switchUserByPin = (pin: string, targetUserId?: string): { success: boolean; user?: AppUser; message?: string } => {
    const user = targetUserId
      ? users.find(u => u.id === targetUserId && u.pinCode === pin && u.isActive)
      : users.find(u => u.pinCode === pin && u.isActive);
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setIsSessionLocked(false);
      localStorage.setItem(STORAGE_KEY_SESSION_LOCKED, 'false');
      
      // Auto redirect to appropriate view if current tab is not authorized
      const cashierRestrictedTabs = ['dgi', 'expenses', 'users', 'settings'];
      if (updatedUser.role === 'CASHIER' && cashierRestrictedTabs.includes(activeTab)) {
        setActiveTab('pos');
      } else if (updatedUser.role === 'STOCK_MANAGER' && ['dgi', 'users', 'settings'].includes(activeTab)) {
        setActiveTab('catalog');
      }

      return { success: true, user: updatedUser };
    }
    return { success: false, message: 'Code PIN incorrect ou utilisateur inactif.' };
  };

  const addUser = (userData: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      permissions: userData.permissions || defaultPermissionsByRole[userData.role],
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updated: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updated }));
    }
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('Impossible de supprimer le seul utilisateur du système.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Audit Trail Logger Helper
  const recordAuditLog = (entry: {
    action: AuditActionType;
    title: string;
    details: string;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  }) => {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Responsable',
      userRole: currentUser?.role || 'ADMIN',
      action: entry.action,
      title: entry.title,
      details: entry.details,
      severity: entry.severity || 'INFO',
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 199)]);
  };

  // Stock Movement Logger Helper
  const recordStockMovement = (movement: Omit<StockMovement, 'id' | 'date'>) => {
    const newMovement: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
    };
    setStockMovements(prev => [newMovement, ...prev]);
  };

  // Record Stock Arrival / Purchase from Supplier
  const recordStockPurchase = (purchaseData: {
    supplierName: string;
    supplierPhone?: string;
    blReference?: string;
    items: { productId: string; quantity: number; unitCostUSD: number }[];
    paymentMethod: PaymentMethod;
    notes?: string;
  }): StockPurchase => {
    const rate = settings.exchangeRateUSD_CDF || 2850;
    const year = new Date().getFullYear();
    const count = stockPurchases.length + 1;
    const purchaseNumber = `ACH-${year}-${String(count).padStart(4, '0')}`;
    const dateIso = new Date().toISOString();
    const operatorName = currentUser?.name || 'Gestionnaire Stock';

    const purchaseItems: StockPurchaseItem[] = [];
    const newMovements: StockMovement[] = [];

    setProducts(prev =>
      prev.map(p => {
        const itemPurchased = purchaseData.items.find(it => it.productId === p.id);
        if (!itemPurchased || itemPurchased.quantity <= 0) return p;

        const currentQty = Math.max(0, p.stockQty);
        const currentCost = p.costPriceUSD || p.priceUSD * 0.7;
        const addedQty = itemPurchased.quantity;
        const addedCost = itemPurchased.unitCostUSD;

        // Calcul automatique du CMUP / PUMP (Coût Moyen Unitaire Pondéré)
        const totalOldVal = currentQty * currentCost;
        const totalNewVal = addedQty * addedCost;
        const newTotalQty = currentQty + addedQty;
        const calculatedCMUP = newTotalQty > 0 ? (totalOldVal + totalNewVal) / newTotalQty : addedCost;

        purchaseItems.push({
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          quantity: addedQty,
          unitCostUSD: addedCost,
          totalCostUSD: addedQty * addedCost,
        });

        newMovements.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          type: 'PURCHASE',
          quantityChange: addedQty,
          previousStock: currentQty,
          newStock: newTotalQty,
          unitCostUSD: addedCost,
          referenceDoc: purchaseData.blReference || purchaseNumber,
          supplierName: purchaseData.supplierName,
          operatorName,
          date: dateIso,
          notes: `Réception arrivage ${purchaseNumber}`,
        });

        return {
          ...p,
          stockQty: newTotalQty,
          costPriceUSD: Math.round(calculatedCMUP * 100) / 100,
        };
      })
    );

    const totalUSD = purchaseItems.reduce((acc, it) => acc + it.totalCostUSD, 0);
    const totalCDF = Math.round(totalUSD * rate);

    const createdPurchase: StockPurchase = {
      id: `pur-${Date.now()}`,
      purchaseNumber,
      date: dateIso,
      supplierName: purchaseData.supplierName,
      supplierPhone: purchaseData.supplierPhone,
      blReference: purchaseData.blReference,
      items: purchaseItems,
      totalUSD,
      totalCDF,
      paymentMethod: purchaseData.paymentMethod,
      recordedBy: operatorName,
      notes: purchaseData.notes,
    };

    setStockPurchases(prev => [createdPurchase, ...prev]);
    if (newMovements.length > 0) {
      setStockMovements(prev => [...newMovements, ...prev]);
    }

    recordAuditLog({
      action: 'STOCK_PURCHASE',
      title: `Arrivage Fournisseur: ${purchaseNumber}`,
      details: `${purchaseItems.length} article(s) réceptionné(s) auprès de ${purchaseData.supplierName} (${totalUSD.toFixed(2)} $).`,
      severity: 'INFO',
    });

    return createdPurchase;
  };

  // Update Exchange rate
  const updateExchangeRate = (newRate: number) => {
    if (newRate <= 0) return;
    const oldRate = settings.exchangeRateUSD_CDF || 2850;
    setSettings(prev => ({
      ...prev,
      exchangeRateUSD_CDF: newRate,
    }));
    recordAuditLog({
      action: 'EXCHANGE_RATE_CHANGE',
      title: 'Modification Taux de Change Officiel BCC',
      details: `Passage de ${oldRate} FC à ${newRate} FC pour 1 $ USD.`,
      severity: 'WARNING',
    });
  };

  const updateSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    if (newSettings.displayCurrency) {
      setSelectedCurrency(newSettings.displayCurrency);
    }
  };

  // Products & Services
  const addProductOrService = (item: Omit<ProductOrService, 'id' | 'createdAt'>) => {
    const newItem: ProductOrService = {
      ...item,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [newItem, ...prev]);
  };

  const updateProductOrService = (id: string, updated: Partial<ProductOrService>) => {
    const oldProd = products.find(p => p.id === id);
    if (oldProd && updated.priceUSD !== undefined && updated.priceUSD !== oldProd.priceUSD) {
      recordAuditLog({
        action: 'PRICE_CHANGE',
        title: `Modification Prix de Vente: ${oldProd.code}`,
        details: `Prix de ${oldProd.name} modifié de ${oldProd.priceUSD.toFixed(2)} $ à ${updated.priceUSD.toFixed(2)} $.`,
        severity: 'WARNING',
      });
    }
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deleteProductOrService = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = (id: string, deltaQty: number, notes?: string) => {
    let pName = '';
    let pCode = '';
    let oldStock = 0;
    let resultingStock = 0;
    let unitCost = 0;

    setProducts(prev =>
      prev.map(p => {
        if (p.id === id && p.type === 'PRODUCT') {
          pName = p.name;
          pCode = p.code;
          oldStock = p.stockQty;
          resultingStock = Math.max(0, p.stockQty + deltaQty);
          unitCost = p.costPriceUSD || p.priceUSD * 0.7;
          return { ...p, stockQty: resultingStock };
        }
        return p;
      })
    );

    if (pName) {
      const operatorName = currentUser?.name || 'Gestionnaire Stock';
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: id,
        productName: pName,
        productCode: pCode,
        type: 'ADJUSTMENT',
        quantityChange: deltaQty,
        previousStock: oldStock,
        newStock: resultingStock,
        unitCostUSD: unitCost,
        operatorName,
        date: new Date().toISOString(),
        notes: notes || (deltaQty > 0 ? `Ajustement inventaire (+${deltaQty})` : `Ajustement casse/perte (${deltaQty})`),
      };
      setStockMovements(prev => [movement, ...prev]);

      recordAuditLog({
        action: 'STOCK_ADJUSTMENT',
        title: `Ajustement Manuel Stock: ${pCode}`,
        details: `${deltaQty >= 0 ? '+' : ''}${deltaQty} unité(s) pour ${pName} (Stock: ${oldStock} -> ${resultingStock}).`,
        severity: Math.abs(deltaQty) > 5 ? 'WARNING' : 'INFO',
      });
    }
  };

  // Clients
  const addClient = (clientData: Omit<Client, 'id' | 'totalSpentUSD' | 'outstandingDebtUSD' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      totalSpentUSD: 0,
      outstandingDebtUSD: 0,
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updated: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteClient = (id: string) => {
    const c = clients.find(cl => cl.id === id);
    if (c) {
      recordAuditLog({
        action: 'CLIENT_DELETE',
        title: `Suppression Fiche Client: ${c.name}`,
        details: `Client ${c.name} (${c.phone}) supprimé par ${currentUser?.name}.`,
        severity: 'WARNING',
      });
    }
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Sales with DGI Normalization Engine & Assigned Cashier
  const createSale = (saleData: {
    type: DocumentType;
    clientId: string;
    items: SaleItem[];
    discountUSD: number;
    taxPercent: number;
    amountPaidUSD: number;
    paymentMethod: PaymentMethod;
    dueDate?: string;
    notes?: string;
    customDate?: string;
    clientName?: string;
    clientPhone?: string;
    clientAddress?: string;
    clientNif?: string;
    cashierName?: string;
    isNormalizedDGI?: boolean;
    dgiExemptionReason?: string;
  }): Sale => {
    const client = clients.find(c => c.id === saleData.clientId);
    const clientName = saleData.clientName || (client ? (client.companyName ? `${client.name} (${client.companyName})` : client.name) : 'Client Comptoir (Consommateur Final)');
    const clientPhone = saleData.clientPhone || (client ? client.phone : '');
    const clientAddress = saleData.clientAddress || (client ? `${client.address || ''} ${client.commune || ''} ${client.city || ''}`.trim() : '');
    const clientNif = saleData.clientNif || client?.nif || client?.rccmOrNif || 'NON-ASSUJETTI';

    const rate = settings.exchangeRateUSD_CDF || 2850;
    const isNormalized = saleData.isNormalizedDGI !== undefined ? saleData.isNormalizedDGI : true;

    const subtotalUSD = saleData.items.reduce((sum, item) => sum + item.subtotalUSD, 0);
    const discount = Math.max(0, saleData.discountUSD || 0);

    let groupABase = 0;
    let groupBBase = 0;
    let groupCBase = 0;
    let groupDBase = 0;

    saleData.items.forEach(item => {
      const itemRatio = subtotalUSD > 0 ? (item.subtotalUSD / subtotalUSD) : 0;
      const netItemSubtotal = Math.max(0, item.subtotalUSD - (discount * itemRatio));

      if (item.taxGroup === 'A') groupABase += netItemSubtotal;
      else if (item.taxGroup === 'B') groupBBase += netItemSubtotal;
      else if (item.taxGroup === 'C') groupCBase += netItemSubtotal;
      else if (item.taxGroup === 'D') groupDBase += netItemSubtotal;
    });

    const isVatActive = saleData.taxPercent > 0 && settings.dgiIsVatSubject;
    const vatGroupARate = isVatActive ? 16 : 0;
    const groupAVatUSD = (groupABase * vatGroupARate) / 100;
    const totalTvaUSD = groupAVatUSD;

    const totalHT_USD = Math.max(0, subtotalUSD - discount);
    const totalTTC_USD = totalHT_USD + totalTvaUSD;
    const totalCDF = Math.round(totalTTC_USD * rate);

    const paidUSD = Math.min(totalTTC_USD, Math.max(0, saleData.amountPaidUSD));
    const remainingDebtUSD = Math.max(0, totalTTC_USD - paidUSD);

    let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
    if (paidUSD >= totalTTC_USD) {
      paymentStatus = 'PAID';
    } else if (paidUSD > 0) {
      paymentStatus = 'PARTIAL';
    }

    const year = new Date().getFullYear();
    const countForType = sales.filter(s => s.type === saleData.type).length + 1;
    const prefix = saleData.type === 'INVOICE' ? 'FAC' : saleData.type === 'QUOTE_PROFORMA' ? 'DEV' : 'REC';
    const saleNumber = `${prefix}-${year}-${String(countForType).padStart(4, '0')}`;

    const lastFiscalCounter = sales.reduce((max, s) => Math.max(max, s.dgiFiscalCounter || 0), settings.dgiFiscalCounterStart || 1000);
    const dgiFiscalCounter = lastFiscalCounter + 1;
    const dgiTerminalId = settings.dgiDefTerminalId || 'DEF-CD-KIN-009482';
    const dgiNfu = `SFN-${year}-${dgiTerminalId.slice(-5)}-${String(dgiFiscalCounter).padStart(6, '0')}`;
    const dateIso = saleData.customDate || new Date().toISOString();

    const dgiSecurityCode = generateDgiSecurityCode(
      settings.nif || 'A2109845B',
      dgiTerminalId,
      dgiFiscalCounter,
      totalTTC_USD,
      dateIso
    );

    const randomDgiReceipt = `REC-DGI-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

    const dgiVatBreakdown: DgiVatBreakdown = {
      groupA: { baseUSD: groupABase, rate: vatGroupARate, vatUSD: groupAVatUSD, totalTTC_USD: groupABase + groupAVatUSD },
      groupB: { baseUSD: groupBBase, rate: 0, vatUSD: 0, totalTTC_USD: groupBBase },
      groupC: { baseUSD: groupCBase, rate: 0, vatUSD: 0, totalTTC_USD: groupCBase },
      groupD: { baseUSD: groupDBase, rate: 0, vatUSD: 0, totalTTC_USD: groupDBase },
      totalHT_USD,
      totalTVA_USD: totalTvaUSD,
      totalTTC_USD,
      totalHT_CDF: Math.round(totalHT_USD * rate),
      totalTVA_CDF: Math.round(totalTvaUSD * rate),
      totalTTC_CDF: totalCDF,
    };

    const cashierName = saleData.cashierName || currentUser?.name || settings.cashierName || 'Responsable Ventes';

    const paymentHistory: PaymentEntry[] = [];
    if (paidUSD > 0) {
      paymentHistory.push({
        id: `pay-${Date.now()}`,
        date: dateIso,
        amountUSD: paidUSD,
        amountCDF: Math.round(paidUSD * rate),
        method: saleData.paymentMethod,
        recordedBy: cashierName,
        notes: paidUSD >= totalTTC_USD ? 'Règlement total' : 'Acompte initial',
      });
    }

    const tempSaleObj: Sale = {
      id: `sale-${Date.now()}`,
      saleNumber,
      type: saleData.type,
      clientId: saleData.clientId,
      clientName,
      clientPhone,
      clientAddress,
      clientNif,
      items: saleData.items,
      subtotalUSD,
      discountUSD: discount,
      taxPercent: isVatActive ? 16 : 0,
      taxAmountUSD: totalTvaUSD,
      totalUSD: totalTTC_USD,
      exchangeRate: rate,
      totalCDF,
      amountPaidUSD: paidUSD,
      remainingDebtUSD,
      paymentStatus,
      paymentMethod: saleData.paymentMethod,
      dueDate: saleData.dueDate,
      notes: saleData.notes,
      cashierName,
      createdAt: dateIso,
      paymentHistory,
      isNormalizedDGI: isNormalized,
      dgiNfu,
      dgiSecurityCode,
      dgiFiscalCounter,
      dgiTerminalId,
      dgiQrPayload: '',
      dgiVatBreakdown,
      dgiExemptionReason: saleData.dgiExemptionReason,
      dgiTransmissionStatus: 'TRANSMITTED',
      dgiReceiptNumber: randomDgiReceipt,
      dgiTransmittedAt: dateIso,
      dgiServerSignature: `DGI-SIG-${dgiSecurityCode.slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`,
    };

    tempSaleObj.dgiQrPayload = generateDgiQrPayload(tempSaleObj, settings);

    if (saleData.type === 'INVOICE' || saleData.type === 'RECEIPT') {
      const saleMovements: StockMovement[] = [];

      setProducts(prev =>
        prev.map(p => {
          const soldItem = saleData.items.find(it => it.itemId === p.id && it.type === 'PRODUCT');
          if (soldItem) {
            const currentQty = p.stockQty;
            const newQty = Math.max(0, currentQty - soldItem.quantity);
            saleMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              productId: p.id,
              productName: p.name,
              productCode: p.code,
              type: 'SALE',
              quantityChange: -soldItem.quantity,
              previousStock: currentQty,
              newStock: newQty,
              unitCostUSD: soldItem.unitCostPriceUSD || p.costPriceUSD,
              referenceDoc: saleNumber,
              operatorName: cashierName,
              date: dateIso,
              notes: `Vente ${saleNumber} (${saleData.type === 'RECEIPT' ? 'Ticket Caisse' : 'Facture'})`,
            });
            return {
              ...p,
              stockQty: newQty,
            };
          }
          return p;
        })
      );

      if (saleMovements.length > 0) {
        setStockMovements(prev => [...saleMovements, ...prev]);
      }

      if (client && client.id !== 'comptoir') {
        setClients(prev =>
          prev.map(c => {
            if (c.id === client.id) {
              return {
                ...c,
                totalSpentUSD: c.totalSpentUSD + totalTTC_USD,
                outstandingDebtUSD: c.outstandingDebtUSD + remainingDebtUSD,
              };
            }
            return c;
          })
        );
      }
    }

    // Audit log if high commercial discount (>= 10%)
    if (discount > 0 && subtotalUSD > 0 && (discount / subtotalUSD) >= 0.1) {
      const discountPct = Math.round((discount / subtotalUSD) * 100);
      recordAuditLog({
        action: 'HIGH_DISCOUNT',
        title: `Remise Commerciale Élevée (${discountPct}%)`,
        details: `Remise exceptionnelle de ${discount.toFixed(2)} $ (${discountPct}%) accordée sur la vente ${saleNumber} (Client: ${clientName}).`,
        severity: 'WARNING',
      });
    }

    setSales(prev => [tempSaleObj, ...prev]);
    return tempSaleObj;
  };

  const recordPayment = (
    saleId: string,
    payment: {
      amountUSD: number;
      method: PaymentMethod;
      reference?: string;
      notes?: string;
    }
  ) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || payment.amountUSD <= 0) return;

    const rate = settings.exchangeRateUSD_CDF || 2850;
    const paymentAmount = Math.min(sale.remainingDebtUSD, payment.amountUSD);
    const newPaidTotal = sale.amountPaidUSD + paymentAmount;
    const newRemainingDebt = Math.max(0, sale.totalUSD - newPaidTotal);
    const newStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = newRemainingDebt <= 0 ? 'PAID' : 'PARTIAL';

    const newPaymentEntry: PaymentEntry = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString(),
      amountUSD: paymentAmount,
      amountCDF: Math.round(paymentAmount * rate),
      method: payment.method,
      reference: payment.reference,
      recordedBy: currentUser?.name || settings.cashierName || 'Responsable Caisse',
      notes: payment.notes,
    };

    setSales(prev =>
      prev.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            amountPaidUSD: newPaidTotal,
            remainingDebtUSD: newRemainingDebt,
            paymentStatus: newStatus,
            paymentHistory: [newPaymentEntry, ...s.paymentHistory],
          };
        }
        return s;
      })
    );

    if (sale.clientId && sale.clientId !== 'comptoir') {
      setClients(prev =>
        prev.map(c => {
          if (c.id === sale.clientId) {
            return {
              ...c,
              outstandingDebtUSD: Math.max(0, c.outstandingDebtUSD - paymentAmount),
            };
          }
          return c;
        })
      );
    }
  };

  const updateSale = (saleId: string, updatedData: {
    type?: DocumentType;
    clientId?: string;
    items?: SaleItem[];
    discountUSD?: number;
    taxPercent?: number;
    amountPaidUSD?: number;
    paymentMethod?: PaymentMethod;
    dueDate?: string;
    notes?: string;
    clientNif?: string;
    isNormalizedDGI?: boolean;
    dgiExemptionReason?: string;
  }) => {
    const oldSale = sales.find(s => s.id === saleId);
    if (!oldSale) return;

    const rate = settings.exchangeRateUSD_CDF || 2850;
    const newItems = updatedData.items || oldSale.items;
    const newDocType = updatedData.type || oldSale.type;
    const newClientId = updatedData.clientId !== undefined ? updatedData.clientId : oldSale.clientId;
    const newClient = clients.find(c => c.id === newClientId);
    const newClientName = newClient ? newClient.name : oldSale.clientName;
    const newClientPhone = newClient ? newClient.phone : oldSale.clientPhone;
    const newClientNif = updatedData.clientNif !== undefined ? updatedData.clientNif : (newClient?.nif || oldSale.clientNif);
    const newDiscountUSD = updatedData.discountUSD !== undefined ? Math.max(0, updatedData.discountUSD) : oldSale.discountUSD;
    const newTaxPercent = updatedData.taxPercent !== undefined ? Math.max(0, updatedData.taxPercent) : oldSale.taxPercent;
    const newAmountPaidUSD = updatedData.amountPaidUSD !== undefined ? Math.max(0, updatedData.amountPaidUSD) : oldSale.amountPaidUSD;
    const newPaymentMethod = updatedData.paymentMethod || oldSale.paymentMethod;
    const newDueDate = updatedData.dueDate !== undefined ? updatedData.dueDate : oldSale.dueDate;
    const newNotes = updatedData.notes !== undefined ? updatedData.notes : oldSale.notes;

    // Recalculate totals
    const subtotalUSD = newItems.reduce((sum, it) => sum + it.subtotalUSD, 0);
    const taxable = Math.max(0, subtotalUSD - newDiscountUSD);
    const groupABase = newItems.filter(i => i.taxGroup === 'A').reduce((sum, it) => {
      const ratio = subtotalUSD > 0 ? it.subtotalUSD / subtotalUSD : 0;
      return sum + (it.subtotalUSD - (newDiscountUSD * ratio));
    }, 0);
    const taxAmountUSD = newTaxPercent > 0 ? (Math.max(0, groupABase) * (newTaxPercent / 100)) : 0;
    const totalUSD = taxable + taxAmountUSD;
    const totalCDF = Math.round(totalUSD * rate);
    const remainingDebtUSD = Math.max(0, totalUSD - newAmountPaidUSD);
    const paymentStatus: SaleStatus = remainingDebtUSD <= 0 ? 'PAID' : newAmountPaidUSD > 0 ? 'PARTIAL' : 'UNPAID';

    // Stock adjustments: if old was invoice/receipt, restore old items, deduct new items
    if (oldSale.type === 'INVOICE' || oldSale.type === 'RECEIPT') {
      setProducts(prev =>
        prev.map(p => {
          const oldItem = oldSale.items.find(it => it.itemId === p.id && it.type === 'PRODUCT');
          const newItem = newItems.find(it => it.itemId === p.id && it.type === 'PRODUCT');
          let currentStock = p.stockQty;
          if (oldItem) currentStock += oldItem.quantity;
          if (newItem && (newDocType === 'INVOICE' || newDocType === 'RECEIPT')) currentStock -= newItem.quantity;
          return { ...p, stockQty: Math.max(0, currentStock) };
        })
      );
    } else if (newDocType === 'INVOICE' || newDocType === 'RECEIPT') {
      // If converted from quote to invoice
      setProducts(prev =>
        prev.map(p => {
          const newItem = newItems.find(it => it.itemId === p.id && it.type === 'PRODUCT');
          if (newItem) {
            return { ...p, stockQty: Math.max(0, p.stockQty - newItem.quantity) };
          }
          return p;
        })
      );
    }

    // Client debt and spending adjustment
    if (oldSale.clientId && oldSale.clientId !== 'comptoir') {
      setClients(prev =>
        prev.map(c => {
          if (c.id === oldSale.clientId) {
            return {
              ...c,
              totalSpentUSD: Math.max(0, c.totalSpentUSD - oldSale.totalUSD),
              outstandingDebtUSD: Math.max(0, c.outstandingDebtUSD - oldSale.remainingDebtUSD),
            };
          }
          return c;
        })
      );
    }
    if (newClientId && newClientId !== 'comptoir' && (newDocType === 'INVOICE' || newDocType === 'RECEIPT')) {
      setClients(prev =>
        prev.map(c => {
          if (c.id === newClientId) {
            return {
              ...c,
              totalSpentUSD: c.totalSpentUSD + totalUSD,
              outstandingDebtUSD: c.outstandingDebtUSD + remainingDebtUSD,
            };
          }
          return c;
        })
      );
    }

    // Recalculate DGI Vat Breakdown
    const groupBBase = newItems.filter(i => i.taxGroup === 'B').reduce((sum, it) => sum + it.subtotalUSD, 0);
    const groupCBase = newItems.filter(i => i.taxGroup === 'C').reduce((sum, it) => sum + it.subtotalUSD, 0);
    const groupDBase = newItems.filter(i => i.taxGroup === 'D').reduce((sum, it) => sum + it.subtotalUSD, 0);

    const dgiVatBreakdown: DgiVatBreakdown = {
      groupA: { baseUSD: groupABase, rate: newTaxPercent, vatUSD: taxAmountUSD, totalTTC_USD: groupABase + taxAmountUSD },
      groupB: { baseUSD: groupBBase, rate: 0, vatUSD: 0, totalTTC_USD: groupBBase },
      groupC: { baseUSD: groupCBase, rate: 0, vatUSD: 0, totalTTC_USD: groupCBase },
      groupD: { baseUSD: groupDBase, rate: 0, vatUSD: 0, totalTTC_USD: groupDBase },
      totalHT_USD: taxable,
      totalTVA_USD: taxAmountUSD,
      totalTTC_USD: totalUSD,
      totalHT_CDF: Math.round(taxable * rate),
      totalTVA_CDF: Math.round(taxAmountUSD * rate),
      totalTTC_CDF: totalCDF,
    };

    const updatedSaleObj: Sale = {
      ...oldSale,
      type: newDocType,
      clientId: newClientId,
      clientName: newClientName,
      clientPhone: newClientPhone,
      clientNif: newClientNif,
      items: newItems,
      subtotalUSD,
      discountUSD: newDiscountUSD,
      taxPercent: newTaxPercent,
      taxAmountUSD,
      totalUSD,
      exchangeRate: rate,
      totalCDF,
      amountPaidUSD: newAmountPaidUSD,
      remainingDebtUSD,
      paymentMethod: newPaymentMethod,
      paymentStatus,
      dueDate: newDueDate,
      notes: newNotes,
      dgiVatBreakdown,
      isNormalizedDGI: updatedData.isNormalizedDGI !== undefined ? updatedData.isNormalizedDGI : oldSale.isNormalizedDGI,
      dgiExemptionReason: updatedData.dgiExemptionReason || oldSale.dgiExemptionReason,
    };

    if (updatedSaleObj.isNormalizedDGI) {
      updatedSaleObj.dgiQrPayload = generateDgiQrPayload(updatedSaleObj, settings);
    }

    setSales(prev => prev.map(s => s.id === saleId ? updatedSaleObj : s));
  };

  const convertQuoteToInvoice = (saleId: string) => {
    const quote = sales.find(s => s.id === saleId);
    if (!quote || quote.type !== 'QUOTE_PROFORMA') return;

    const year = new Date().getFullYear();
    const invoiceCount = sales.filter(s => s.type === 'INVOICE').length + 1;
    const newInvoiceNumber = `FAC-${year}-${String(invoiceCount).padStart(4, '0')}`;

    setProducts(prev =>
      prev.map(p => {
        const soldItem = quote.items.find(it => it.itemId === p.id && it.type === 'PRODUCT');
        if (soldItem) {
          return {
            ...p,
            stockQty: Math.max(0, p.stockQty - soldItem.quantity),
          };
        }
        return p;
      })
    );

    if (quote.clientId && quote.clientId !== 'comptoir') {
      setClients(prev =>
        prev.map(c => {
          if (c.id === quote.clientId) {
            return {
              ...c,
              totalSpentUSD: c.totalSpentUSD + quote.totalUSD,
              outstandingDebtUSD: c.outstandingDebtUSD + quote.remainingDebtUSD,
            };
          }
          return c;
        })
      );
    }

    setSales(prev =>
      prev.map(s => {
        if (s.id === saleId) {
          return {
            ...s,
            type: 'INVOICE',
            saleNumber: newInvoiceNumber,
            notes: (s.notes ? s.notes + '\n' : '') + `(Converti depuis le Devis Proforma ${quote.saleNumber})`,
          };
        }
        return s;
      })
    );
  };

  const deleteSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    recordAuditLog({
      action: 'SALE_DELETE',
      title: `Suppression Document: ${sale.saleNumber}`,
      details: `${sale.type === 'INVOICE' ? 'Facture' : sale.type === 'RECEIPT' ? 'Ticket de Caisse' : 'Devis'} de ${sale.totalUSD.toFixed(2)} $ pour ${sale.clientName} annulé(e) et supprimé(e).`,
      severity: 'CRITICAL',
    });

    if (sale.type === 'INVOICE' || sale.type === 'RECEIPT') {
      setProducts(prev =>
        prev.map(p => {
          const item = sale.items.find(it => it.itemId === p.id && it.type === 'PRODUCT');
          if (item) {
            return {
              ...p,
              stockQty: p.stockQty + item.quantity,
            };
          }
          return p;
        })
      );

      if (sale.clientId && sale.clientId !== 'comptoir') {
        setClients(prev =>
          prev.map(c => {
            if (c.id === sale.clientId) {
              return {
                ...c,
                totalSpentUSD: Math.max(0, c.totalSpentUSD - sale.totalUSD),
                outstandingDebtUSD: Math.max(0, c.outstandingDebtUSD - sale.remainingDebtUSD),
              };
            }
            return c;
          })
        );
      }
    }

    setSales(prev => prev.filter(s => s.id !== saleId));
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const rate = settings.exchangeRateUSD_CDF || 2850;
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      exchangeRate: rate,
      amountCDF: Math.round(expenseData.amountUSD * rate),
      recordedBy: currentUser?.name || 'Responsable',
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Equipment CRUD
  const addEquipment = (equipmentData: Omit<NetworkEquipment, 'id' | 'createdAt' | 'updatedAt'>): NetworkEquipment => {
    const now = new Date().toISOString();
    const newEquipment: NetworkEquipment = {
      ...equipmentData,
      id: `eq-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setEquipments(prev => [newEquipment, ...prev]);
    return newEquipment;
  };

  const updateEquipment = (id: string, updatedData: Partial<NetworkEquipment>) => {
    const now = new Date().toISOString();
    setEquipments(prev =>
      prev.map(eq =>
        eq.id === id
          ? {
              ...eq,
              ...updatedData,
              updatedAt: now,
            }
          : eq
      )
    );
  };

  const deleteEquipment = (id: string) => {
    setEquipments(prev => prev.filter(eq => eq.id !== id));
  };

  // 1. Bons de Livraison (BL) & Décharges Matériel
  const addDeliveryNote = (noteData: Omit<DeliveryNote, 'id' | 'createdAt' | 'updatedAt'>): DeliveryNote => {
    const now = new Date().toISOString();
    const newNote: DeliveryNote = {
      ...noteData,
      id: `bl-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setDeliveryNotes(prev => [newNote, ...prev]);
    showNotification(`Bon de Livraison ${newNote.deliveryNumber} créé avec succès`, 'success');
    return newNote;
  };

  const updateDeliveryNote = (id: string, updatedData: Partial<DeliveryNote>) => {
    const now = new Date().toISOString();
    setDeliveryNotes(prev =>
      prev.map(note =>
        note.id === id
          ? {
              ...note,
              ...updatedData,
              updatedAt: now,
            }
          : note
      )
    );
  };

  const deleteDeliveryNote = (id: string) => {
    setDeliveryNotes(prev => prev.filter(n => n.id !== id));
    showNotification('Bon de livraison supprimé', 'info');
  };

  // 2. Ordres de Mission & Interventions Techniques
  const addWorkOrder = (orderData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): WorkOrder => {
    const now = new Date().toISOString();
    const newOrder: WorkOrder = {
      ...orderData,
      id: `om-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setWorkOrders(prev => [newOrder, ...prev]);
    showNotification(`Ordre de Mission ${newOrder.orderNumber} planifié avec succès`, 'success');
    return newOrder;
  };

  const updateWorkOrder = (id: string, updatedData: Partial<WorkOrder>) => {
    const now = new Date().toISOString();
    setWorkOrders(prev =>
      prev.map(order =>
        order.id === id
          ? {
              ...order,
              ...updatedData,
              updatedAt: now,
            }
          : order
      )
    );
  };

  const deleteWorkOrder = (id: string) => {
    setWorkOrders(prev => prev.filter(o => o.id !== id));
    showNotification('Ordre de mission supprimé', 'info');
  };

  // 3. Abonnements & Contrats de Maintenance SAV
  const addSubscription = (subData: Omit<SubscriptionContract, 'id' | 'createdAt' | 'updatedAt'>): SubscriptionContract => {
    const now = new Date().toISOString();
    const newSub: SubscriptionContract = {
      ...subData,
      id: `sub-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setSubscriptions(prev => [newSub, ...prev]);
    showNotification(`Contrat d'abonnement ${newSub.contractNumber} enregistré`, 'success');
    return newSub;
  };

  const updateSubscription = (id: string, updatedData: Partial<SubscriptionContract>) => {
    const now = new Date().toISOString();
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === id
          ? {
              ...sub,
              ...updatedData,
              updatedAt: now,
            }
          : sub
      )
    );
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    showNotification('Abonnement supprimé', 'info');
  };

  const renewSubscription = (id: string, monthsToAdd: number = 1) => {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;
    const currentNext = new Date(sub.nextBillingDate || new Date());
    currentNext.setMonth(currentNext.getMonth() + monthsToAdd);
    const newBillingDate = currentNext.toISOString().split('T')[0];

    updateSubscription(id, {
      nextBillingDate: newBillingDate,
      status: 'ACTIVE',
    });
    showNotification(`Abonnement ${sub.contractNumber} renouvelé jusqu'au ${newBillingDate}`, 'success');
  };

  const generateSubscriptionInvoice = (subscriptionId: string): Sale | null => {
    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return null;

    const rate = settings.exchangeRateUSD_CDF || 2850;
    const saleItem: SaleItem = {
      itemId: `sub-item-${sub.id}`,
      name: `${sub.title} (${sub.billingCycle === 'MONTHLY' ? 'Mensuel' : sub.billingCycle === 'QUARTERLY' ? 'Trimestriel' : 'Annuel'})`,
      code: sub.contractNumber,
      type: 'SERVICE',
      unit: 'Mois',
      quantity: 1,
      unitPriceUSD: sub.priceUSD,
      unitCostPriceUSD: sub.priceUSD * 0.7,
      subtotalUSD: sub.priceUSD,
      taxGroup: 'A',
      taxRate: 16,
      taxAmountUSD: (sub.priceUSD * 16) / 100,
    };

    const newSale = createSale({
      type: 'INVOICE',
      clientId: sub.clientId,
      items: [saleItem],
      discountUSD: 0,
      taxPercent: settings.dgiIsVatSubject ? 16 : 0,
      amountPaidUSD: 0,
      paymentMethod: 'BANK_TRANSFER',
      dueDate: sub.nextBillingDate,
      notes: `Facture de renouvellement d'abonnement / contrat ${sub.contractNumber}. Échéance : ${sub.nextBillingDate}.`,
    });

    const now = new Date().toISOString();
    updateSubscription(subscriptionId, {
      lastInvoicedDate: now.split('T')[0],
      lastInvoiceNumber: newSale.saleNumber,
      status: 'ACTIVE',
    });

    setActivePrintSale(newSale);
    showNotification(`✓ Facture ${newSale.saleNumber} générée pour ${sub.clientName}`, 'success');
    return newSale;
  };

  const addToCart = (item: ProductOrService, qty: number = 1, customUnitPrice?: number) => {
    // Resolve unit price based on explicit override or current posPricingTier
    const resolvedUnitPrice = customUnitPrice !== undefined
      ? Math.max(0, customUnitPrice)
      : posPricingTier === 'WHOLESALE' && item.priceWholesaleUSD !== undefined && item.priceWholesaleUSD > 0
      ? item.priceWholesaleUSD
      : posPricingTier === 'SEMI_WHOLESALE' && item.priceSemiWholesaleUSD !== undefined && item.priceSemiWholesaleUSD > 0
      ? item.priceSemiWholesaleUSD
      : item.priceUSD;

    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        const nextQty = existing.quantity + qty;
        return prev.map(i =>
          i.itemId === item.id
            ? {
                ...i,
                quantity: nextQty,
                unitPriceUSD: customUnitPrice !== undefined ? resolvedUnitPrice : i.unitPriceUSD,
                subtotalUSD: nextQty * (customUnitPrice !== undefined ? resolvedUnitPrice : i.unitPriceUSD),
                taxAmountUSD: i.taxRate > 0 ? (nextQty * (customUnitPrice !== undefined ? resolvedUnitPrice : i.unitPriceUSD) * (i.taxRate / 100)) : 0,
              }
            : i
        );
      } else {
        const isTaxed = item.taxGroup === 'A';
        return [
          ...prev,
          {
            itemId: item.id,
            name: item.name,
            code: item.code,
            type: item.type,
            unit: item.unit,
            quantity: qty,
            unitPriceUSD: resolvedUnitPrice,
            unitCostPriceUSD: item.costPriceUSD,
            subtotalUSD: qty * resolvedUnitPrice,
            taxGroup: item.taxGroup || 'A',
            taxRate: isTaxed ? 16 : 0,
            taxAmountUSD: isTaxed ? (qty * resolvedUnitPrice * 0.16) : 0,
            maxStock: item.type === 'PRODUCT' ? item.stockQty : undefined,
          },
        ];
      }
    });
  };

  const updateCartItemUnitPrice = (itemId: string, newUnitPrice: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.itemId === itemId) {
          const validPrice = Math.max(0, newUnitPrice);
          const subtotalUSD = i.quantity * validPrice;
          const taxAmountUSD = i.taxRate > 0 ? subtotalUSD * (i.taxRate / 100) : 0;
          return {
            ...i,
            unitPriceUSD: validPrice,
            subtotalUSD,
            taxAmountUSD,
          };
        }
        return i;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    if (qty < 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(i =>
        i.itemId === itemId
          ? {
              ...i,
              quantity: qty,
              subtotalUSD: qty * i.unitPriceUSD,
              taxAmountUSD: i.taxRate > 0 ? (qty * i.unitPriceUSD * (i.taxRate / 100)) : 0,
            }
          : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // ----------------------------------------------------
  // PORTAIL CLIENT EN LIGNE (Catalogue & Devis Proforma)
  // ----------------------------------------------------

  const addToPortalCart = (item: ProductOrService, quantity: number = 1) => {
    const validQty = Math.max(1, quantity);
    setPortalCart(prev => {
      const existingIndex = prev.findIndex(ci => ci.item.id === item.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + validQty,
        };
        return next;
      }
      return [...prev, { item, quantity: validQty }];
    });
  };

  const updatePortalCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromPortalCart(itemId);
      return;
    }
    setPortalCart(prev =>
      prev.map(ci => ci.item.id === itemId ? { ...ci, quantity } : ci)
    );
  };

  const removeFromPortalCart = (itemId: string) => {
    setPortalCart(prev => prev.filter(ci => ci.item.id !== itemId));
  };

  const clearPortalCart = () => {
    setPortalCart([]);
  };

  const loginPortalClient = (identifier: string, password?: string) => {
    const cleanId = identifier.trim().toLowerCase().replace(/[\s\-\.]/g, '');
    const found = clients.find(c => {
      const cPhone = c.phone.toLowerCase().replace(/[\s\-\.]/g, '');
      const cEmail = (c.email || '').toLowerCase().trim();
      const cName = c.name.toLowerCase().trim();
      const cCompany = (c.companyName || '').toLowerCase().trim();
      return (
        (cleanId.length >= 4 && cPhone.includes(cleanId)) ||
        (cleanId.length >= 4 && cleanId.includes(cPhone)) ||
        cEmail === cleanId ||
        cName.includes(identifier.trim().toLowerCase()) ||
        cCompany.includes(identifier.trim().toLowerCase())
      );
    });

    if (!found) {
      return { success: false, message: 'Aucun compte client trouvé avec ces coordonnées.' };
    }

    if (password && found.password && found.password !== password) {
      return { success: false, message: 'Mot de passe incorrect.' };
    }

    setPortalClient(found);
    return { success: true, client: found };
  };

  const registerPortalClient = (clientData: Omit<Client, 'id' | 'totalSpentUSD' | 'outstandingDebtUSD' | 'createdAt'>): Client => {
    const newClient = addClient({
      ...clientData,
      isRegisteredOnPortal: true,
      password: clientData.password || 'client123',
    });
    setPortalClient(newClient);
    return newClient;
  };

  const logoutPortalClient = () => {
    setPortalClient(null);
  };

  const createPortalProforma = (params: {
    notes?: string;
    validityDays?: number;
    isVatActive?: boolean;
    customDiscountUSD?: number;
    guestName?: string;
    guestCompany?: string;
    guestPhone?: string;
  }): Sale | null => {
    if (portalCart.length === 0) return null;

    const validityDays = params.validityDays || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + validityDays);

    const saleItems: SaleItem[] = portalCart.map(({ item, quantity }) => {
      const unitPriceUSD = item.priceUSD;
      const subtotalUSD = unitPriceUSD * quantity;
      const isTaxed = params.isVatActive && item.taxGroup === 'A';
      const taxRate = isTaxed ? (settings.taxPercent || 16) : 0;
      const taxAmountUSD = (subtotalUSD * taxRate) / 100;
      return {
        itemId: item.id,
        name: item.name,
        code: item.code,
        type: item.type,
        unit: item.unit,
        quantity,
        unitPriceUSD,
        unitCostPriceUSD: item.costPriceUSD || (unitPriceUSD * 0.7),
        subtotalUSD,
        taxGroup: item.taxGroup || 'A',
        taxRate,
        taxAmountUSD,
      };
    });

    const clientId = portalClient ? portalClient.id : 'comptoir';
    const computedClientName = portalClient
      ? (portalClient.companyName ? `${portalClient.name} (${portalClient.companyName})` : portalClient.name)
      : (params.guestName ? (params.guestCompany ? `${params.guestName} (${params.guestCompany})` : params.guestName) : undefined);
    const computedClientPhone = portalClient ? portalClient.phone : (params.guestPhone || undefined);

    const clientNote = params.notes?.trim() ? `Note client : ${params.notes.trim()}` : '';
    const proformaNotes = [
      'Devis Proforma généré via le Portail Client en Ligne.',
      `Offre de prix valable ${validityDays} jours.`,
      clientNote,
    ].filter(Boolean).join(' ');

    const newSale = createSale({
      type: 'QUOTE_PROFORMA',
      clientId,
      clientName: computedClientName,
      clientPhone: computedClientPhone,
      items: saleItems,
      discountUSD: params.customDiscountUSD || 0,
      taxPercent: params.isVatActive ? (settings.taxPercent || 16) : 0,
      amountPaidUSD: 0,
      paymentMethod: 'BANK_TRANSFER',
      dueDate: dueDate.toISOString(),
      notes: proformaNotes,
      isNormalizedDGI: false,
    });

    clearPortalCart();
    return newSale;
  };

  // Current active cash session
  const currentCashSession = useMemo(() => {
    return cashSessions.find((s) => s.status === 'OPEN') || null;
  }, [cashSessions]);

  const openCashSession = (data: {
    openingFloatUSD: number;
    openingFloatCDF: number;
    cashierName?: string;
    supervisorName?: string;
  }) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const sessionCount = cashSessions.length + 1;
    const sessionNumber = `CS-${todayStr}-${String(sessionCount).padStart(2, '0')}`;

    const newSession: CashRegisterSession = {
      id: `session-${Date.now()}`,
      sessionNumber,
      cashierId: currentUser.id || 'usr-default',
      cashierName: data.cashierName || currentUser.name || settings.cashierName || 'Caissier Principal',
      supervisorName: data.supervisorName || 'Direction Générale',
      openedAt: now.toISOString(),
      status: 'OPEN',
      openingFloatUSD: Number(data.openingFloatUSD || 0),
      openingFloatCDF: Number(data.openingFloatCDF || 0),
    };

    setCashSessions((prev) => [newSession, ...prev]);
    return newSession;
  };

  const closeCashSession = (data: {
    countedUSD: number;
    countedCDF: number;
    notes?: string;
    supervisorName?: string;
    reportType?: 'Z' | 'X';
    billetageUSD?: CashBilletageUSD;
    billetageCDF?: CashBilletageCDF;
  }) => {
    if (!currentCashSession) {
      throw new Error('Aucune session de caisse ouverte.');
    }

    const rate = settings.exchangeRateUSD_CDF || 2850;
    const sessionStart = currentCashSession.openedAt;
    const now = new Date().toISOString();

    // Find all sales made during this session
    const sessionSales = sales.filter((s) => {
      return s.createdAt >= sessionStart && s.type !== 'QUOTE_PROFORMA';
    });

    const totalSalesUSD = sessionSales.reduce((acc, s) => acc + (s.totalUSD || 0), 0);
    const totalSalesCDF = sessionSales.reduce((acc, s) => acc + (s.totalCDF || 0), 0);
    const vatCollectedUSD = sessionSales.reduce((acc, s) => acc + (s.taxAmountUSD || 0), 0);

    const cashSalesUSD = sessionSales
      .filter((s) => s.paymentMethod === 'CASH_USD')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const cashSalesCDF = sessionSales
      .filter((s) => s.paymentMethod === 'CASH_CDF')
      .reduce((acc, s) => acc + (s.amountPaidUSD * rate || 0), 0);

    const mobileMoneyUSD = sessionSales
      .filter((s) => ['MPESA', 'ORANGE_MONEY', 'AIRTEL_MONEY', 'AFRIMONEY'].includes(s.paymentMethod))
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const mobileMoneyCDF = Math.round(mobileMoneyUSD * rate);

    const bankSalesUSD = sessionSales
      .filter((s) => s.paymentMethod === 'BANK_TRANSFER')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const bankSalesCDF = Math.round(bankSalesUSD * rate);

    // Expected in drawer = initial float + cash sales
    const expectedCashInDrawerUSD = currentCashSession.openingFloatUSD + cashSalesUSD;
    const expectedCashInDrawerCDF = currentCashSession.openingFloatCDF + cashSalesCDF;

    const countedUSD = Number(data.countedUSD || 0);
    const countedCDF = Number(data.countedCDF || 0);

    const differenceUSD = countedUSD - expectedCashInDrawerUSD;
    const differenceCDF = countedCDF - expectedCashInDrawerCDF;

    const updatedSession: CashRegisterSession = {
      ...currentCashSession,
      status: 'CLOSED',
      closedAt: now,
      reportType: data.reportType || 'Z',
      closingCountedUSD: countedUSD,
      closingCountedCDF: countedCDF,
      closingNotes: data.notes || '',
      supervisorName: data.supervisorName || currentCashSession.supervisorName || 'Direction Générale',
      billetageUSD: data.billetageUSD,
      billetageCDF: data.billetageCDF,
      totalSalesUSD,
      totalSalesCDF,
      cashSalesUSD,
      cashSalesCDF,
      mobileMoneyUSD,
      mobileMoneyCDF,
      bankSalesUSD,
      bankSalesCDF,
      vatCollectedUSD,
      expectedCashInDrawerUSD,
      expectedCashInDrawerCDF,
      differenceUSD,
      differenceCDF,
      totalTransactionsCount: sessionSales.length,
    };

    setCashSessions((prev) =>
      prev.map((s) => (s.id === currentCashSession.id ? updatedSession : s))
    );

    return updatedSession;
  };

  const generateInterimReportX = (data?: {
    countedUSD?: number;
    countedCDF?: number;
    notes?: string;
    billetageUSD?: CashBilletageUSD;
    billetageCDF?: CashBilletageCDF;
  }): CashRegisterSession | null => {
    if (!currentCashSession) return null;

    const rate = settings.exchangeRateUSD_CDF || 2850;
    const sessionStart = currentCashSession.openedAt;
    const sessionSales = sales.filter((s) => s.createdAt >= sessionStart && s.type !== 'QUOTE_PROFORMA');

    const totalSalesUSD = sessionSales.reduce((acc, s) => acc + (s.totalUSD || 0), 0);
    const totalSalesCDF = sessionSales.reduce((acc, s) => acc + (s.totalCDF || 0), 0);
    const vatCollectedUSD = sessionSales.reduce((acc, s) => acc + (s.taxAmountUSD || 0), 0);

    const cashSalesUSD = sessionSales
      .filter((s) => s.paymentMethod === 'CASH_USD')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const cashSalesCDF = sessionSales
      .filter((s) => s.paymentMethod === 'CASH_CDF')
      .reduce((acc, s) => acc + (s.amountPaidUSD * rate || 0), 0);

    const mobileMoneyUSD = sessionSales
      .filter((s) => ['MPESA', 'ORANGE_MONEY', 'AIRTEL_MONEY', 'AFRIMONEY'].includes(s.paymentMethod))
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const mobileMoneyCDF = Math.round(mobileMoneyUSD * rate);

    const bankSalesUSD = sessionSales
      .filter((s) => s.paymentMethod === 'BANK_TRANSFER')
      .reduce((acc, s) => acc + (s.amountPaidUSD || 0), 0);

    const bankSalesCDF = Math.round(bankSalesUSD * rate);

    const expectedCashInDrawerUSD = currentCashSession.openingFloatUSD + cashSalesUSD;
    const expectedCashInDrawerCDF = currentCashSession.openingFloatCDF + cashSalesCDF;

    const countedUSD = data?.countedUSD !== undefined ? Number(data.countedUSD) : expectedCashInDrawerUSD;
    const countedCDF = data?.countedCDF !== undefined ? Number(data.countedCDF) : expectedCashInDrawerCDF;

    return {
      ...currentCashSession,
      status: 'OPEN',
      reportType: 'X',
      closedAt: new Date().toISOString(),
      closingCountedUSD: countedUSD,
      closingCountedCDF: countedCDF,
      closingNotes: data?.notes || 'Contrôle intermédiaire de caisse (Rapport X mi-journée)',
      billetageUSD: data?.billetageUSD,
      billetageCDF: data?.billetageCDF,
      totalSalesUSD,
      totalSalesCDF,
      cashSalesUSD,
      cashSalesCDF,
      mobileMoneyUSD,
      mobileMoneyCDF,
      bankSalesUSD,
      bankSalesCDF,
      vatCollectedUSD,
      expectedCashInDrawerUSD,
      expectedCashInDrawerCDF,
      differenceUSD: countedUSD - expectedCashInDrawerUSD,
      differenceCDF: countedCDF - expectedCashInDrawerCDF,
      totalTransactionsCount: sessionSales.length,
    };
  };

  const togglePaymentReconciliation = (paymentId: string) => {
    let reconciledState = false;
    setSales(prev =>
      prev.map(s => {
        const hasPayment = s.paymentHistory.some(p => p.id === paymentId);
        if (!hasPayment) return s;
        return {
          ...s,
          paymentHistory: s.paymentHistory.map(p => {
            if (p.id === paymentId) {
              const newState = !p.isReconciled;
              reconciledState = newState;
              return {
                ...p,
                isReconciled: newState,
                reconciledAt: newState ? new Date().toISOString() : undefined,
                reconciledBy: newState ? currentUser.name : undefined,
              };
            }
            return p;
          }),
        };
      })
    );
    showNotification(
      reconciledState
        ? '✓ Transaction pointée et rapprochée avec succès'
        : 'ℹ Pointage de la transaction annulé',
      'info'
    );
  };

  const createPortalWorkOrderTicket = (ticket: {
    title: string;
    type: WorkOrderType;
    siteName: string;
    siteAddress?: string;
    notes: string;
    priority?: 'NORMAL' | 'URGENT' | 'CRITICAL';
  }): WorkOrder => {
    const year = new Date().getFullYear();
    const orderCount = workOrders.length + 1;
    const orderNumber = `OM-${year}-${String(orderCount).padStart(4, '0')}`;

    const newOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      orderNumber,
      title: ticket.title,
      type: ticket.type,
      clientId: portalClient?.id || 'cli-portal',
      clientName: portalClient?.name || 'Client Portail B2B',
      clientPhone: portalClient?.phone || '',
      siteName: ticket.siteName,
      siteAddress: ticket.siteAddress || portalClient?.address || '',
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'SCHEDULED',
      assignedTechnicians: ['Équipe Intervention Rapide HibTech'],
      priority: ticket.priority || 'NORMAL',
      technicalDetails: {},
      tasksPerformed: ['Ticket SAV créé en ligne depuis le portail client'],
      technicianNotes: ticket.notes,
      signedByClient: false,
      signedByTechnician: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkOrders(prev => [newOrder, ...prev]);
    showNotification(`✓ Ticket d'intervention ${orderNumber} enregistré avec succès`, 'success');
    return newOrder;
  };

  const deleteCashSession = (sessionId: string) => {
    setCashSessions((prev) => {
      const target = prev.find((s) => s.id === sessionId);
      const updated = prev.filter((s) => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEY_CASH_SESSIONS, JSON.stringify(updated));
      if (target) {
        recordAuditLog({
          action: 'SESSION_DELETE',
          title: `Suppression session caisse ${target.sessionNumber}`,
          details: `La session de caisse ${target.sessionNumber} (${target.cashierName}) a été supprimée.`,
          severity: 'WARNING',
        });
      }
      return updated;
    });
  };

  const resetToDemoData = () => {
    setProducts(initialProductsAndServices);
    setClients(initialClients);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setEquipments(initialEquipments);
    setDeliveryNotes(initialDeliveryNotes);
    setWorkOrders(initialWorkOrders);
    setSubscriptions(initialSubscriptions);
    setSettings(initialCompanySettings);
    setUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
    setCart([]);
    localStorage.clear();
  };

  const wipeData = (options: WipeDataOptions) => {
    const deletedParts: string[] = [];

    if (options.resetAll) {
      setSales([]);
      setCart([]);
      setCashSessions([]);
      setExpenses([]);
      setStockPurchases([]);
      setStockMovements([]);
      setEquipments([]);
      const defaultComptoir = initialClients[0] || {
        id: 'comptoir',
        name: 'Client Comptoir (Consommateur Final)',
        phone: '',
        type: 'INDIVIDUAL',
        city: '',
        totalSpentUSD: 0,
        outstandingDebtUSD: 0,
        createdAt: new Date().toISOString(),
      };
      setClients([defaultComptoir]);
      setProducts([]);

      localStorage.removeItem(STORAGE_KEY_SALES);
      localStorage.removeItem(STORAGE_KEY_CASH_SESSIONS);
      localStorage.removeItem(STORAGE_KEY_EXPENSES);
      localStorage.removeItem(STORAGE_KEY_STOCK_PURCHASES);
      localStorage.removeItem(STORAGE_KEY_STOCK_MOVEMENTS);
      localStorage.removeItem(STORAGE_KEY_EQUIPMENTS);
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify([defaultComptoir]));

      recordAuditLog({
        action: 'DATA_WIPE',
        title: 'Effacement total de la base de données',
        details: 'Toutes les transactions, factures, caisses, clients et catalogue ont été remis à zéro.',
        severity: 'CRITICAL',
      });
      return;
    }

    if (options.sales) {
      setSales([]);
      setCart([]);
      localStorage.removeItem(STORAGE_KEY_SALES);
      deletedParts.push('Ventes & Factures');
    }

    if (options.cashSessions) {
      setCashSessions([]);
      localStorage.removeItem(STORAGE_KEY_CASH_SESSIONS);
      deletedParts.push('Sessions de Caisse');
    }

    if (options.expenses) {
      setExpenses([]);
      localStorage.removeItem(STORAGE_KEY_EXPENSES);
      deletedParts.push('Dépenses');
    }

    if (options.clients) {
      const defaultComptoir = initialClients[0] || {
        id: 'comptoir',
        name: 'Client Comptoir (Consommateur Final)',
        phone: '',
        type: 'INDIVIDUAL',
        city: 'Lubumbashi',
        totalSpentUSD: 0,
        outstandingDebtUSD: 0,
        createdAt: new Date().toISOString(),
      };
      setClients([defaultComptoir]);
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify([defaultComptoir]));
      deletedParts.push('Clients');
    }

    if (options.products) {
      setProducts([]);
      setStockPurchases([]);
      setStockMovements([]);
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.removeItem(STORAGE_KEY_STOCK_PURCHASES);
      localStorage.removeItem(STORAGE_KEY_STOCK_MOVEMENTS);
      deletedParts.push('Catalogue & Stocks');
    }

    if (options.equipments) {
      setEquipments([]);
      setDeliveryNotes([]);
      setWorkOrders([]);
      setSubscriptions([]);
      localStorage.removeItem(STORAGE_KEY_EQUIPMENTS);
      localStorage.removeItem(STORAGE_KEY_DELIVERY_NOTES);
      localStorage.removeItem(STORAGE_KEY_WORK_ORDERS);
      localStorage.removeItem(STORAGE_KEY_SUBSCRIPTIONS);
      deletedParts.push('Parc & Opérations Terrain');
    }

    if (options.auditLogs) {
      setAuditLogs([]);
      localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
      deletedParts.push('Journal d\'audit');
    }

    if (deletedParts.length > 0) {
      recordAuditLog({
        action: 'DATA_WIPE',
        title: `Suppression de données : ${deletedParts.join(', ')}`,
        details: `L'opérateur a purgé : ${deletedParts.join(', ')}.`,
        severity: 'CRITICAL',
      });
    }
  };

  const exportDatabaseJSON = () => {
    const backup = {
      version: '4.0-DGI-RDC-RBAC',
      exportedAt: new Date().toISOString(),
      company: settings,
      users,
      products,
      clients,
      sales,
      expenses,
      equipments,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CongoBiz_DGI_RBAC_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJSON = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.clients && Array.isArray(data.clients)) setClients(data.clients);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.equipments && Array.isArray(data.equipments)) setEquipments(data.equipments);
      if (data.users && Array.isArray(data.users)) setUsers(data.users);
      if (data.company && typeof data.company === 'object') setSettings(data.company);
      return true;
    } catch (e) {
      console.error('Failed to import database:', e);
      return false;
    }
  };

  // Accounting actions
  const addAccountingEntry = (entryData: Omit<AccountingEntry, 'id' | 'createdAt'>): AccountingEntry => {
    const newEntry: AccountingEntry = {
      ...entryData,
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setCustomAccountingEntries((prev) => [newEntry, ...prev]);
    recordAuditLog({
      action: 'ACCOUNTING_ENTRY',
      title: 'Nouvelle écriture comptable SYSCOHADA',
      details: `Journal ${newEntry.journal} - Pièce ${newEntry.pieceRef} (${newEntry.accountNumber})`,
      severity: 'INFO',
    });
    showNotification(`Écriture ${newEntry.pieceRef} enregistrée au journal ${newEntry.journal}`, 'success');
    return newEntry;
  };

  const deleteAccountingEntry = (id: string) => {
    setCustomAccountingEntries((prev) => prev.filter((e) => e.id !== id));
    showNotification('Écriture comptable supprimée', 'info');
  };

  // Computed metrics
  const metrics = useMemo(() => {
    const validSales = sales.filter(s => s.type === 'INVOICE' || s.type === 'RECEIPT');
    const totalRevenueUSD = validSales.reduce((acc, s) => acc + s.totalUSD, 0);
    const totalCollectedUSD = validSales.reduce((acc, s) => acc + s.amountPaidUSD, 0);
    const totalDebtsUSD = validSales.reduce((acc, s) => acc + s.remainingDebtUSD, 0);
    const totalExpensesUSD = expenses.reduce((acc, e) => acc + e.amountUSD, 0);

    const totalTvaCollectedUSD = validSales.reduce((acc, s) => acc + s.taxAmountUSD, 0);
    const rate = settings.exchangeRateUSD_CDF || 2850;
    const totalTvaCollectedCDF = Math.round(totalTvaCollectedUSD * rate);
    const totalTaxableBaseUSD = validSales.reduce((acc, s) => acc + s.subtotalUSD - s.discountUSD, 0);
    const normalizedInvoicesCount = validSales.filter(s => s.isNormalizedDGI).length;

    const totalCOGS = validSales.reduce((acc, s) => {
      const saleCOGS = s.items.reduce((itemAcc, item) => itemAcc + item.unitCostPriceUSD * item.quantity, 0);
      return acc + saleCOGS;
    }, 0);

    const grossMarginUSD = (totalRevenueUSD - totalTvaCollectedUSD) - totalCOGS;
    const grossMarginPercent = (totalRevenueUSD - totalTvaCollectedUSD) > 0 ? (grossMarginUSD / (totalRevenueUSD - totalTvaCollectedUSD)) * 100 : 0;
    const netProfitUSD = grossMarginUSD - totalExpensesUSD;
    const totalRevenueCDF = Math.round(totalRevenueUSD * rate);

    // Today and Month metrics
    const todayIso = new Date().toISOString().slice(0, 10);
    const monthIso = new Date().toISOString().slice(0, 7);

    const todaySales = validSales.filter(s => s.createdAt.slice(0, 10) === todayIso);
    const todayRevenueUSD = todaySales.reduce((acc, s) => acc + s.totalUSD, 0);
    const todayRevenueCDF = Math.round(todayRevenueUSD * rate);

    const monthSales = validSales.filter(s => s.createdAt.slice(0, 7) === monthIso);
    const monthRevenueUSD = monthSales.reduce((acc, s) => acc + s.totalUSD, 0);
    const monthRevenueCDF = Math.round(monthRevenueUSD * rate);

    const monthExpenses = expenses.filter(e => e.date.slice(0, 7) === monthIso);
    const monthExpensesUSD = monthExpenses.reduce((acc, e) => acc + e.amountUSD, 0);

    const now = new Date();
    const overdueDebtsUSD = validSales.reduce((acc, s) => {
      if (s.remainingDebtUSD > 0 && s.dueDate) {
        if (new Date(s.dueDate) < now) {
          return acc + s.remainingDebtUSD;
        }
      }
      return acc;
    }, 0);

    const productsCount = products.filter(p => p.type === 'PRODUCT').length;
    const servicesCount = products.filter(p => p.type === 'SERVICE').length;
    const lowStockCount = products.filter(p => p.type === 'PRODUCT' && p.stockQty <= p.minStockAlert).length;
    const unpaidInvoicesCount = validSales.filter(s => s.paymentStatus !== 'PAID').length;

    return {
      totalRevenueUSD,
      totalRevenueCDF,
      totalCollectedUSD,
      totalDebtsUSD,
      totalExpensesUSD,
      netProfitUSD,
      grossMarginUSD,
      grossMarginPercent,
      todayRevenueUSD,
      todayRevenueCDF,
      monthRevenueUSD,
      monthRevenueCDF,
      monthExpensesUSD,
      overdueDebtsUSD,
      productsCount,
      servicesCount,
      lowStockCount,
      unpaidInvoicesCount,
      totalTvaCollectedUSD,
      totalTvaCollectedCDF,
      totalTaxableBaseUSD,
      normalizedInvoicesCount,
    };
  }, [sales, expenses, products, settings.exchangeRateUSD_CDF]);

  return (
    <AppContext.Provider
      value={{
        products,
        clients,
        sales,
        expenses,
        settings,
        users,
        currentUser,
        isSessionLocked,
        setCurrentUser,
        switchUserByPin,
        addUser,
        updateUser,
        deleteUser,
        hasPermission,
        lockSession,
        logout,
        unlockSession,
        activeTab,
        setActiveTab,
        isMobileNavOpen,
        setIsMobileNavOpen,
        selectedCurrency,
        setSelectedCurrency,
        updateExchangeRate,
        updateSettings,
        addProductOrService,
        updateProductOrService,
        deleteProductOrService,
        adjustStock,
        addClient,
        updateClient,
        deleteClient,
        createSale,
        updateSale,
        recordPayment,
        convertQuoteToInvoice,
        deleteSale,
        addExpense,
        deleteExpense,
        equipments,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        activePrintEquipment,
        setActivePrintEquipment,
        deliveryNotes,
        addDeliveryNote,
        updateDeliveryNote,
        deleteDeliveryNote,
        workOrders,
        addWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        renewSubscription,
        generateSubscriptionInvoice,
        activePrintSale,
        setActivePrintSale,
        activeWhatsAppClient,
        setActiveWhatsAppClient,
        isUserSwitchModalOpen,
        setIsUserSwitchModalOpen,
        isDataWipeModalOpen,
        setIsDataWipeModalOpen,
        cart,
        posPricingTier,
        setPosPricingTier,
        addToCart,
        updateCartItemUnitPrice,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cashSessions,
        currentCashSession,
        openCashSession,
        closeCashSession,
        generateInterimReportX,
        deleteCashSession,
        togglePaymentReconciliation,
        createPortalWorkOrderTicket,
        stockPurchases,
        stockMovements,
        recordStockPurchase,
        recordStockMovement,
        auditLogs,
        recordAuditLog,
        resetToDemoData,
        wipeData,
        exportDatabaseJSON,
        importDatabaseJSON,
        metrics,
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
        notification,
        showNotification,
        clearNotification,
        customAccountingEntries,
        addAccountingEntry,
        deleteAccountingEntry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
