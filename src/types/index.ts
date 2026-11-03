export type Currency = 'USD' | 'CDF';

export type PaymentMethod = 
  | 'CASH_USD' 
  | 'CASH_CDF' 
  | 'MPESA' 
  | 'ORANGE_MONEY' 
  | 'AIRTEL_MONEY' 
  | 'AFRIMONEY' 
  | 'BANK_TRANSFER' 
  | 'CREDIT';

export type ItemType = 'PRODUCT' | 'SERVICE';

export type ClientType = 'INDIVIDUAL' | 'COMPANY';

export type SaleStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type DocumentType = 'INVOICE' | 'QUOTE_PROFORMA' | 'RECEIPT';

export type FiscalTaxGroup = 'A' | 'B' | 'C' | 'D'; 

export type DgiTransmissionStatus = 'TRANSMITTED' | 'PENDING' | 'FAILED' | 'OFFLINE_QUEUED';

export type UserRole = 
  | 'SUPER_ADMIN'     // Gérant / Administrateur Général (Accès complet)
  | 'MANAGER'         // Responsable Commercial / Superviseur
  | 'CASHIER'         // Caissier / Agent de Vente POS (Vente, encaissement, tickets)
  | 'ACCOUNTANT'      // Comptable / Déclarant Fiscal DGI (Factures, TVA, DGI, Dépenses)
  | 'STOCK_MANAGER';  // Magasinier / Gestionnaire de Stock (Inventaire, Réappro)

export interface UserPermissions {
  canAccessPOS: boolean;
  canCreateInvoices: boolean;
  canDeleteInvoices: boolean;
  canManageClients: boolean;
  canAccessDGI: boolean;
  canManageCatalog: boolean;
  canManageExpenses: boolean;
  canManageEquipments?: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canViewProfitMargins: boolean;
  canChangeExchangeRate: boolean;
  canReprintInvoices?: boolean;
  canAccessAccounting?: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  pinCode: string; // Code PIN à 4 chiffres pour bascule rapide de caisse
  reprintPassword?: string; // Mot de passe d'autorisation de réimpression de ticket POS
  isActive: boolean;
  assignedRegister?: string; // ex: "Caisse Principale 1"
  permissions: UserPermissions;
  lastLogin?: string;
  createdAt: string;
}

export type PricingTier = 'RETAIL' | 'SEMI_WHOLESALE' | 'WHOLESALE';

export interface ProductOrService {
  id: string;
  name: string;
  code: string;
  barcode?: string;
  type: ItemType;
  category: string;
  description?: string;
  unit: string;
  priceUSD: number;
  priceSemiWholesaleUSD?: number; // Prix Demi-Gros
  priceWholesaleUSD?: number;     // Prix Grossiste
  costPriceUSD: number;
  stockQty: number;
  minStockAlert: number;
  taxGroup: FiscalTaxGroup;
  isActive: boolean;
  imageUrl?: string;
  features?: string[];
  brand?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  type: ClientType;
  pricingTier?: PricingTier; // Grille tarifaire assignée au client
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city: string;
  commune?: string;
  nif?: string;
  rccmOrNif?: string;
  isVatSubject?: boolean;
  totalSpentUSD: number;
  outstandingDebtUSD: number;
  notes?: string;
  password?: string;
  isRegisteredOnPortal?: boolean;
  createdAt: string;
}

export interface PortalCartItem {
  item: ProductOrService;
  quantity: number;
}

export interface SaleItem {
  itemId: string;
  name: string;
  code: string;
  type: ItemType;
  unit: string;
  quantity: number;
  unitPriceUSD: number;
  unitCostPriceUSD: number;
  subtotalUSD: number;
  taxGroup: FiscalTaxGroup;
  taxRate: number;
  taxAmountUSD: number;
}

export interface PaymentEntry {
  id: string;
  date: string;
  amountUSD: number;
  amountCDF: number;
  method: PaymentMethod;
  reference?: string;
  recordedBy: string;
  notes?: string;
  isReconciled?: boolean; // Pointé & Rapproché (Mobile Money / Banque)
  reconciledAt?: string;
  reconciledBy?: string;
}

export interface VatGroupSummary {
  baseUSD: number;
  rate: number;
  vatUSD: number;
  totalTTC_USD: number;
}

export interface DgiVatBreakdown {
  groupA: VatGroupSummary;
  groupB: VatGroupSummary;
  groupC: VatGroupSummary;
  groupD: VatGroupSummary;
  totalHT_USD: number;
  totalTVA_USD: number;
  totalTTC_USD: number;
  totalHT_CDF: number;
  totalTVA_CDF: number;
  totalTTC_CDF: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  type: DocumentType;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  clientNif?: string;
  items: SaleItem[];
  subtotalUSD: number;
  discountUSD: number;
  taxPercent: number;
  taxAmountUSD: number;
  totalUSD: number;
  exchangeRate: number;
  totalCDF: number;
  amountPaidUSD: number;
  remainingDebtUSD: number;
  paymentStatus: SaleStatus;
  paymentMethod: PaymentMethod;
  dueDate?: string;
  notes?: string;
  cashierName: string;
  createdAt: string;
  paymentHistory: PaymentEntry[];

  // DGI RDC Normalization & Dispositif Électronique Fiscal (DEF)
  isNormalizedDGI: boolean;
  dgiNfu: string;
  dgiSecurityCode: string;
  dgiFiscalCounter: number;
  dgiTerminalId: string;
  dgiQrPayload: string;
  dgiVatBreakdown: DgiVatBreakdown;
  dgiExemptionReason?: string;

  // DGI Direct Teletransmission & Server receipt
  dgiTransmissionStatus: DgiTransmissionStatus;
  dgiReceiptNumber?: string;
  dgiTransmittedAt?: string;
  dgiServerSignature?: string;
}

export type ExpenseCategory = 
  | 'LOYER' 
  | 'TRANSPORT' 
  | 'ELECTRICITE_CARBURANT' 
  | 'COMMUNICATION' 
  | 'SALAIRES' 
  | 'FOURNITURES' 
  | 'IMPOTS_TAXES' 
  | 'MAINTENANCE' 
  | 'AUTRES';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amountUSD: number;
  amountCDF: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  date: string;
  beneficiary?: string;
  recordedBy: string;
  receiptRef?: string;
}

export interface DgiApiConfig {
  environment: 'PRODUCTION' | 'SANDBOX';
  endpointUrl: string;
  dgiAccountEmail: string;
  apiKey: string;
  apiSecret: string;
  certificateNumber: string;
  autoTransmitOnIssue: boolean;
  isConnected: boolean;
  lastSyncTimestamp?: string;
  lastPingLatencyMs?: number;
}

export interface CompanySettings {
  name: string;
  slogan: string;
  activityDescription: string;
  rccm: string;
  idNat: string;
  nif: string;
  phone1: string;
  phone2?: string;
  email: string;
  address: string;
  city: string;
  country: string;
  exchangeRateUSD_CDF: number;
  displayCurrency: Currency;
  
  // DGI Fiscal Configuration
  dgiCenter: string;
  dgiRegime: string;
  dgiIsVatSubject: boolean;
  dgiDefTerminalId: string;
  dgiExemptionReason?: string;
  dgiFiscalCounterStart: number;
  dgiApiConfig: DgiApiConfig;
  
  enableTaxByDefault: boolean;
  taxPercent: number;
  mpesaNumber: string;
  mpesaName: string;
  orangeMoneyNumber: string;
  orangeMoneyName: string;
  airtelMoneyNumber: string;
  airtelMoneyName: string;
  afrimoneyNumber?: string;
  bankDetails: string;
  invoiceFooterNotes: string;
  cashierName: string;

  // Document, Invoicing & Visual Identity
  logoUrl?: string;
  showLogoOnInvoices?: boolean;
  signatureUrl?: string;
  stampUrl?: string;
  cashPaidStampUrl?: string; // Image / Cachet "PAYÉ CASH" ou "PAYÉ COMPTANT"
  signatoryTitle?: string;
  signatoryName?: string;
  includeSignatureOnInvoicesByDefault?: boolean;
  includeStampOnInvoicesByDefault?: boolean;
  includeCashPaidStampByDefault?: boolean; // Apposer automatiquement le Cachet PAYÉ CASH sur les règlements en espèces

  // Direct Printing & Automatic PDF Backup
  pdfExportPath?: string; // e.g. 'C:\\hibtech'
  autoDownloadPdfOnPrint?: boolean; // Auto download PDF immediately when clicking Imprimer
  autoCloseModalOnPrint?: boolean; // Auto close the print window immediately after print
}

// ----------------------------------------------------
// EQUIPMENT & NETWORK CONFIGURATIONS MANAGEMENT
// ----------------------------------------------------

export type EquipmentType = 
  | 'STARLINK'
  | 'CCTV_CAMERA'
  | 'NVR_DVR'
  | 'ROUTER'
  | 'ACCESS_POINT'
  | 'SWITCH_OTHER';

export type EquipmentStatus = 
  | 'ACTIVE'           // En Service / Opérationnel
  | 'MAINTENANCE'      // En Maintenance / Test
  | 'OFFLINE'          // Hors-Ligne / Incident
  | 'IN_STOCK';        // En Stock / Prêt pour Déploiement

export interface StarlinkSpecifics {
  kitNumber?: string;
  dishSerial?: string;
  terminalId?: string;
  accountEmail?: string;
  subscriptionPlan?: string; // ex: Standard Résidentiel, Mobile / Itinérance, Priorité Entreprise
  publicIpOrCgnat?: string;
  bypassModeEnabled?: boolean;
  routerModel?: string; // ex: Starlink Gen 2, Starlink Gen 3 WiFi 6, Starlink Mini
  wifiSsid?: string;
  wifiPassword?: string;
  gpsCoordinates?: string;
  obstructionPercentage?: number;
  averageLatencyMs?: number;
  
  // Supervision & Télémétrie Starlink
  linkStatus?: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  dataUsageGB?: number;       // ex: 420 (GB consommés)
  dataLimitGB?: number;       // ex: 1000 (Forfait 1TB)
  billingCycleRenewalDate?: string; // ex: '2026-11-05'
  downloadSpeedMbps?: number; // ex: 185
  uploadSpeedMbps?: number;   // ex: 28
  lastPingTime?: string;
}

export interface CctvCameraSpecifics {
  brand?: string; // ex: Hikvision, Dahua, Uniview, TP-Link VIGI, Axis
  model?: string;
  cameraType?: 'DOME' | 'BULLET' | 'PTZ' | 'EYEBALL' | 'PANORAMIC';
  ipAddress?: string;
  httpPort?: number;
  rtspPort?: number;
  onvifPort?: number;
  username?: string;
  password?: string;
  resolution?: string; // ex: 2MP (1080p), 4MP (2K), 8MP (4K)
  codec?: string; // H.264 / H.265+
  lensSize?: string; // 2.8mm, 4mm, Varifocal 2.8-12mm
  hasAudio?: boolean;
  poeSwitchPort?: string;
  nvrChannel?: number;
  installedLocation?: string; // ex: Entrée Principale, Caisse, Parking, Entrepôt
}

export interface NvrDvrSpecifics {
  brand?: string; // Hikvision, Dahua, Uniview, Tiandy
  model?: string;
  channelCount?: number; // 4, 8, 16, 32, 64
  connectedCamerasCount?: number;
  ipAddress?: string;
  httpPort?: number;
  serverPort?: number;
  rtspPort?: number;
  username?: string;
  password?: string;
  p2pCloudId?: string; // Hik-Connect / DMSS / EZView
  p2pVerificationCode?: string;
  hddCapacityTb?: number; // ex: 4TB, 8TB, 16TB
  hddCount?: number;
  retentionDays?: number; // ex: 30 jours
  firmwareVersion?: string;
}

export interface RouterSpecifics {
  brand?: string; // MikroTik, Cisco, Ubiquiti, TP-Link, pfSense, Fortinet
  model?: string; // ex: CCR2004, RB5009, hEX S, ER-X, UDM Pro
  firmwareOrOs?: string; // RouterOS v7.14, UniFi OS 3.2, pfSense 2.7
  ipWan?: string;
  wanType?: 'STATIC' | 'DHCP' | 'PPPOE' | 'STARLINK_BYPASS' | 'LTE_BACKUP';
  ipLanGateway?: string; // ex: 192.168.88.1/24
  dhcpPoolRange?: string; // ex: 192.168.88.10-192.168.88.250
  dnsServers?: string; // 1.1.1.1, 8.8.8.8
  adminUsername?: string;
  adminPassword?: string;
  winboxOrWebPort?: number;
  sshPort?: number;
  vpnType?: 'WIREGUARD' | 'OPENVPN' | 'L2TP_IPSEC' | 'TAILSCALE' | 'NONE';
  vpnConfigDetails?: string;
  activeVlans?: string; // ex: VLAN 10 (Admin), VLAN 20 (Caméras), VLAN 30 (Invités)
  backupConfigScript?: string;
}

export interface AccessPointSpecifics {
  brand?: string; // Ubiquiti UniFi, MikroTik, TP-Link Omada, Ruijie, Aruba
  model?: string; // ex: UniFi U6 Pro, UniFi U6+, EAP650, cAP ax
  ipAddress?: string;
  macAddress?: string;
  controllerIpOrCloud?: string; // ex: https://unifi.ui.com ou 192.168.88.2:8443
  primarySsid?: string;
  primaryWifiPassword?: string;
  guestSsid?: string;
  guestWifiPassword?: string;
  frequencyBands?: string; // 2.4GHz / 5GHz / WiFi 6
  channel24G?: string; // Auto, 1, 6, 11
  channel5G?: string; // Auto, 36, 48, 149
  powerPoeRequirement?: string; // 802.3af PoE (15.4W), 802.3at PoE+ (30W)
  adminUsername?: string;
  adminPassword?: string;
}

export interface NetworkEquipment {
  id: string;
  name: string;
  type: EquipmentType;
  clientId: string;
  clientName: string;
  siteName: string;
  siteAddress?: string;
  serialNumber: string;
  macAddress?: string;
  status: EquipmentStatus;
  installationDate: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  assignedTechnician?: string;
  notes?: string;
  
  starlink?: StarlinkSpecifics;
  cctvCamera?: CctvCameraSpecifics;
  nvrDvr?: NvrDvrSpecifics;
  router?: RouterSpecifics;
  accessPoint?: AccessPointSpecifics;
  
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// 1. GESTION DES BONS DE LIVRAISON (BL) & DÉCHARGES
// ----------------------------------------------------

export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryItem {
  id: string;
  name: string;
  serialNumber?: string;
  quantity: number;
  accessories?: string[];
  condition: 'NEUF_SOUS_BLISTER' | 'TESTE_ET_FONCTIONNEL' | 'OCCASION_REVISEE';
}

export interface DeliveryNote {
  id: string;
  deliveryNumber: string; // ex: BL-2026-0042
  saleId?: string; // Liaison optionnelle avec une vente/facture
  saleNumber?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  deliveryAddress: string;
  siteName?: string;
  date: string;
  status: DeliveryStatus;
  transporterName: string;
  transporterPhone?: string;
  vehiclePlate?: string;
  items: DeliveryItem[];
  recipientName?: string;
  recipientTitle?: string;
  deliveredAt?: string;
  dischargeNotes?: string;
  signedByClient: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// 2. ORDRES DE MISSION & FICHES D'INTERVENTION TERRAIN
// ----------------------------------------------------

export type WorkOrderStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'VALIDATED' | 'CANCELLED';

export type WorkOrderType = 
  | 'INSTALLATION_STARLINK' 
  | 'INSTALLATION_CCTV' 
  | 'CABLING_NETWORK' 
  | 'ROUTER_WIFI_CONFIG' 
  | 'MAINTENANCE_PREVENTIVE' 
  | 'MAINTENANCE_CURATIVE_SAV';

export interface WorkOrderTechnicalDetails {
  // Starlink
  starlinkKitNumber?: string;
  azimuthElevationAngle?: string;
  obstructionPercentage?: number;
  latencyMs?: number;
  downloadSpeedMbps?: number;
  uploadSpeedMbps?: number;
  // Network & IP
  ipWan?: string;
  ipLanGateway?: string;
  dnsServers?: string;
  // WiFi
  wifiSsid?: string;
  wifiPassword?: string;
  frequencyBand?: string;
  // CCTV & NVR
  camerasCountInstalled?: number;
  nvrModel?: string;
  nvrIpAddress?: string;
  cloudP2pStatus?: 'CONNECTED' | 'OFFLINE';
}

export interface WorkOrder {
  id: string;
  orderNumber: string; // ex: OM-2026-0018
  type: WorkOrderType;
  title: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  siteName: string;
  siteAddress: string;
  scheduledDate: string;
  completedDate?: string;
  status: WorkOrderStatus;
  assignedTechnicians: string[];
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  technicalDetails: WorkOrderTechnicalDetails;
  tasksPerformed: string[];
  materialsUsed?: { name: string; quantity: number }[];
  clientFeedback?: 'EXCELLENT' | 'SATISFAIT' | 'RESERVES';
  clientFeedbackNotes?: string;
  technicianNotes?: string;
  signedByClient: boolean;
  clientSignatureBase64?: string; // Signature tactile capturée au doigt/stylet
  signedByTechnician: boolean;
  technicianSignatureBase64?: string; // Signature technicien
  photos?: {
    id: string;
    url: string; // Base64 data URL ou URL d'image
    stage: 'BEFORE' | 'DURING' | 'AFTER';
    caption: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// 3. GESTION DES ABONNEMENTS & CONTRATS DE MAINTENANCE SAV
// ----------------------------------------------------

export type SubscriptionType = 
  | 'STARLINK_SERVICE' 
  | 'IT_MAINTENANCE' 
  | 'CCTV_SURVEILLANCE_MAINTENANCE' 
  | 'NETWORK_SLA';

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export type SubscriptionStatus = 'ACTIVE' | 'PENDING_RENEWAL' | 'OVERDUE' | 'SUSPENDED' | 'CANCELLED';

export interface SubscriptionContract {
  id: string;
  contractNumber: string; // ex: SUB-2026-0105
  type: SubscriptionType;
  title: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  equipmentId?: string;
  equipmentSerialNumber?: string;
  billingCycle: BillingCycle;
  priceUSD: number;
  priceCDF: number;
  startDate: string;
  nextBillingDate: string;
  expirationDate: string;
  status: SubscriptionStatus;
  planName?: string;
  accountIdentifier?: string;
  coverageDetails?: string;
  autoRenew: boolean;
  lastInvoicedDate?: string;
  lastInvoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// GESTION DE CAISSE, AUTORISATION & CLÔTURE DE VENTE
// ----------------------------------------------------

export interface CashBilletageUSD {
  b100: number; // Billets de $100
  b50: number;  // Billets de $50
  b20: number;  // Billets de $20
  b10: number;  // Billets de $10
  b5: number;   // Billets de $5
  b1: number;   // Billets de $1
}

export interface CashBilletageCDF {
  b20000: number; // Billets de 20 000 FC
  b10000: number; // Billets de 10 000 FC
  b5000: number;  // Billets de 5 000 FC
  b1000: number;  // Billets de 1 000 FC
  b500: number;   // Billets de 500 FC
}

export interface CashRegisterSession {
  id: string;
  sessionNumber: string;
  cashierId: string;
  cashierName: string;
  supervisorName?: string;
  openedAt: string;
  closedAt?: string;
  status: 'OPEN' | 'CLOSED';
  reportType?: 'Z' | 'X'; // Z = Clôture définitive, X = Contrôle provisoire
  openingFloatUSD: number;
  openingFloatCDF: number;
  closingCountedUSD?: number;
  closingCountedCDF?: number;
  closingNotes?: string;
  
  // Billetage physique détaillé des coupures
  billetageUSD?: CashBilletageUSD;
  billetageCDF?: CashBilletageCDF;

  // Computed totals for reporting (Rapport Z Journalier)
  totalSalesUSD?: number;
  totalSalesCDF?: number;
  cashSalesUSD?: number;
  cashSalesCDF?: number;
  mobileMoneyUSD?: number;
  mobileMoneyCDF?: number;
  bankSalesUSD?: number;
  bankSalesCDF?: number;
  vatCollectedUSD?: number;
  expectedCashInDrawerUSD?: number;
  expectedCashInDrawerCDF?: number;
  differenceUSD?: number;
  differenceCDF?: number;
  totalTransactionsCount?: number;
}

// ----------------------------------------------------
// APPROVISIONNEMENTS, ACHATS & MOUVEMENTS DE STOCKS
// ----------------------------------------------------

export type StockMovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  type: StockMovementType;
  quantityChange: number; // positif pour entrée, négatif pour sortie
  previousStock: number;
  newStock: number;
  unitCostUSD?: number;
  referenceDoc?: string; // N° BL ou N° Vente
  supplierName?: string;
  operatorName: string;
  date: string;
  notes?: string;
}

export interface StockPurchaseItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitCostUSD: number;
  totalCostUSD: number;
}

export interface StockPurchase {
  id: string;
  purchaseNumber: string;
  date: string;
  supplierName: string;
  supplierPhone?: string;
  blReference?: string;
  items: StockPurchaseItem[];
  totalUSD: number;
  totalCDF: number;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  notes?: string;
}

// ----------------------------------------------------
// AUDIT TRAIL & TRAÇABILITÉ DES ACTIONS SENSIBLES
// ----------------------------------------------------

export type AuditActionType =
  | 'PRICE_CHANGE'
  | 'HIGH_DISCOUNT'
  | 'SALE_DELETE'
  | 'EXCHANGE_RATE_CHANGE'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_PURCHASE'
  | 'CLIENT_DELETE'
  | 'USER_ROLE_CHANGE'
  | 'SESSION_DELETE'
  | 'INVOICE_REPRINT'
  | 'DATA_WIPE'
  | 'ACCOUNTING_ENTRY';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: AuditActionType;
  title: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface WipeDataOptions {
  sales?: boolean;
  cashSessions?: boolean;
  expenses?: boolean;
  clients?: boolean;
  products?: boolean;
  equipments?: boolean;
  auditLogs?: boolean;
  resetAll?: boolean;
}

// ----------------------------------------------------------------------------
// COMPTABILITÉ SYSCOHADA (RDC)
// ----------------------------------------------------------------------------
export type SyscohadaJournalCode = 'VT' | 'CA' | 'ACH' | 'OD' | 'BQ';

export interface AccountingEntry {
  id: string;
  date: string;
  journal: SyscohadaJournalCode;
  journalLabel: string;
  pieceRef: string;
  accountNumber: string;
  accountLabel: string;
  description: string;
  debitUSD: number;
  creditUSD: number;
  debitCDF: number;
  creditCDF: number;
  exchangeRate: number;
  sourceType: 'SALE' | 'PAYMENT' | 'EXPENSE' | 'MANUAL_OD';
  sourceId?: string;
  isCustom?: boolean;
  createdAt: string;
}

export interface SyscohadaAccount {
  accountNumber: string;
  accountClass: number; // 1 to 7
  label: string;
  category: 'BILAN_ACTIF' | 'BILAN_PASSIF' | 'CHARGE' | 'PRODUIT';
  description?: string;
}

