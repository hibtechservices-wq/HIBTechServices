import * as XLSX from 'xlsx';
import {
  Sale,
  ProductOrService,
  Client,
  Expense,
  NetworkEquipment,
  CompanySettings,
} from '../types';

/**
 * Universal Excel / CSV Exporter using SheetJS
 */
export function exportToExcel(
  filename: string,
  sheets: { sheetName: string; data: any[] }[]
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // sheet names max 31 chars
  });

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Download sample Excel Template (.xlsx) for any module
 */
export function downloadExcelTemplate(
  moduleType: 'PRODUCTS' | 'CLIENTS' | 'EXPENSES' | 'EQUIPMENTS' | 'SALES'
) {
  let data: any[] = [];
  let filename = '';

  switch (moduleType) {
    case 'PRODUCTS':
      filename = 'Modele_Import_Articles_Stock.xlsx';
      data = [
        {
          Reference: 'PRD-001',
          Nom_Article: 'Câble Réseau RJ45 Cat6 305m',
          Type: 'PRODUCT', // PRODUCT ou SERVICE
          Categorie: 'Réseaux & Câblage',
          Prix_Vente_USD: 120.0,
          Cout_Achat_USD: 75.0,
          Stock_Actuel: 15,
          Seuil_Alerte: 3,
          Unite: 'Bobine',
          Groupe_Taxe_TVA: 'A', // A (16%), B (0%), C (Exonéré), D (Hors champ)
          Code_Barre: '693123456789',
          Description: 'Câble réseau cuivre catégorie 6 FTP haute qualité',
        },
        {
          Reference: 'SRV-001',
          Nom_Article: 'Installation et Configuration Starlink',
          Type: 'SERVICE',
          Categorie: 'Prestations Réseaux',
          Prix_Vente_USD: 250.0,
          Cout_Achat_USD: 50.0,
          Stock_Actuel: 0,
          Seuil_Alerte: 0,
          Unite: 'Forfait',
          Groupe_Taxe_TVA: 'A',
          Code_Barre: '',
          Description: 'Pointage antenne, fixation mât, configuration LAN/Wifi',
        },
      ];
      break;

    case 'CLIENTS':
      filename = 'Modele_Import_Clients_CRM.xlsx';
      data = [
        {
          Nom_Complet: 'Mining Global SARL',
          Nom_Entreprise: 'Mining Global SARL',
          Type_Client: 'COMPANY', // COMPANY ou INDIVIDUAL
          Telephone: '+243 998 000 111',
          WhatsApp: '+243 998 000 111',
          Email: 'contact@miningglobal.cd',
          Ville: 'Kolwezi',
          Commune_Quartier: 'Joli Site',
          Adresse: '12 Avenue des Métaux',
          NIF_ou_RCCM: 'A1234567Z',
          Solde_Dette_USD: 0.0,
        },
        {
          Nom_Complet: 'Dr. Mukendi Patrice',
          Nom_Entreprise: 'Cabinet Médical La Grâce',
          Type_Client: 'INDIVIDUAL',
          Telephone: '+243 812 345 678',
          WhatsApp: '+243 812 345 678',
          Email: 'pmukendi@gmail.com',
          Ville: '',
          Commune_Quartier: '',
          Adresse: '45 Boulevard du 30 Juin',
          NIF_ou_RCCM: '',
          Solde_Dette_USD: 0.0,
        },
      ];
      break;

    case 'EXPENSES':
      filename = 'Modele_Import_Depenses.xlsx';
      data = [
        {
          Description: 'Achat Carburant Mazout Groupe Électrogène 100L',
          Categorie: 'ELECTRICITE_CARBURANT', // ELECTRICITE_CARBURANT, LOYER, COMMUNICATION, TRANSPORT, SALAIRES, FOURNITURES, IMPOTS_TAXES, MAINTENANCE, AUTRE
          Montant_USD: 160.0,
          Date: new Date().toISOString().slice(0, 10),
          Mode_Paiement: 'CASH_USD', // CASH_USD, CASH_CDF, MPESA, ORANGE_MONEY, AIRTEL_MONEY, AFRIMONEY, BANK_TRANSFER
          Beneficiaire: 'Station TotalEnergies',
          Reference_Piece: 'BL-98442',
        },
        {
          Description: 'Abonnement Fibre Optique Haut Débit Bureau',
          Categorie: 'COMMUNICATION',
          Montant_USD: 200.0,
          Date: new Date().toISOString().slice(0, 10),
          Mode_Paiement: 'BANK_TRANSFER',
          Beneficiaire: 'Liquid Intelligent Technologies',
          Reference_Piece: 'FAC-LIT-2026-03',
        },
      ];
      break;

    case 'EQUIPMENTS':
      filename = 'Modele_Import_Equipements_Reseaux.xlsx';
      data = [
        {
          Nom_Equipement: 'Kit Starlink V3 Standard - Site Chantier',
          Type: 'STARLINK', // STARLINK, CCTV_CAMERA, NVR_DVR, ROUTER, ACCESS_POINT
          Client: 'Mining Global SARL',
          Site: 'Chantier Minier Kolwezi',
          Numero_Serie: 'KIT-SLK-2026-9901',
          Adresse_MAC: '70:EE:50:AA:BB:CC',
          Statut: 'ACTIVE', // ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED
          Date_Installation: new Date().toISOString().slice(0, 10),
          Technicien: 'Ing. Patient M.',
          // Propriétés spécifiques selon le type :
          Starlink_KitNumber: 'KIT00394821',
          Starlink_Plan: 'PRIORITY_MOBILE',
          Starlink_IP: '100.64.12.89',
          Starlink_SSID: 'MINING-STARLINK-5G',
          Camera_Marque: '',
          Camera_Resolution: '',
          Router_Marque: '',
          Router_IP_LAN: '',
          AP_SSID: '',
          Notes: 'Antenne fixée sur mât de 6 mètres, avec parafoudre et onduleur.',
        },
      ];
      break;

    case 'SALES':
      filename = 'Modele_Export_Factures.xlsx';
      data = [
        {
          Numero_Facture: 'FACT-2026-0001',
          Type: 'INVOICE',
          Client: 'Mining Global SARL',
          Telephone_Client: '+243 998 000 111',
          Date_Emission: new Date().toISOString().slice(0, 10),
          Total_USD: 1450.0,
          Total_CDF: 4132500,
          Montant_Paye_USD: 1450.0,
          Solde_Restant_USD: 0.0,
          Statut_Paiement: 'PAID',
          Mode_Paiement: 'BANK_TRANSFER',
          Articles_Description: 'Kit Starlink V3 (x1), Installation et support (x1)',
        },
      ];
      break;
  }

  exportToExcel(filename, [{ sheetName: 'Modele', data }]);
}

/**
 * Parse uploaded Excel or CSV file to JSON array
 */
export function parseExcelOrCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper to normalize string for comparison
 */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Convert imported raw Excel rows into ProductOrService objects
 */
export function mapRowsToProducts(rows: any[]): Partial<ProductOrService>[] {
  return rows.map((row, idx) => {
    const obj: any = {};
    Object.keys(row).forEach((k) => {
      obj[normalizeKey(k)] = row[k];
    });

    const name = obj.nomarticle || obj.nom || obj.designation || obj.name || obj.article || `Article ${idx + 1}`;
    const code = obj.reference || obj.code || obj.ref || `PRD-${Date.now()}-${idx}`;
    const typeStr = (obj.type || 'PRODUCT').toString().toUpperCase();
    const type = typeStr.includes('SERV') ? 'SERVICE' : 'PRODUCT';
    const category = obj.categorie || obj.category || (type === 'SERVICE' ? 'Prestations & Services' : 'Matériel & Articles');
    const sellingPriceUSD = parseFloat(obj.prixventeusd || obj.prixvente || obj.prixusd || obj.prix || obj.sellingprice || 0) || 0;
    const costPriceUSD = parseFloat(obj.coutachatusd || obj.coutachat || obj.prixachat || obj.costprice || 0) || (sellingPriceUSD * 0.7);
    const stockQty = type === 'SERVICE' ? 0 : parseInt(obj.stockactuel || obj.stock || obj.quantite || obj.qty || 0, 10) || 0;
    const minStockAlert = parseInt(obj.seuilalerte || obj.alerte || obj.minstock || 5, 10) || 5;
    const unit = obj.unite || obj.unit || (type === 'SERVICE' ? 'Prestation' : 'Pièce');
    const taxGroup = (obj.groupetaxetva || obj.tva || obj.taxgroup || 'A').toString().toUpperCase().trim()[0] || 'A';
    const barcode = (obj.codebarre || obj.barcode || '').toString().trim();
    const description = (obj.description || obj.notes || '').toString().trim();

    return {
      code,
      name,
      type: type as 'PRODUCT' | 'SERVICE',
      category,
      sellingPriceUSD,
      costPriceUSD,
      stockQty,
      minStockAlert,
      unit,
      taxGroup: ['A', 'B', 'C', 'D'].includes(taxGroup) ? (taxGroup as any) : 'A',
      barcode: barcode || undefined,
      description: description || undefined,
    };
  });
}

/**
 * Convert imported raw Excel rows into Client objects
 */
export function mapRowsToClients(rows: any[]): Partial<Client>[] {
  return rows.map((row, idx) => {
    const obj: any = {};
    Object.keys(row).forEach((k) => {
      obj[normalizeKey(k)] = row[k];
    });

    const name = obj.nomcomplet || obj.nom || obj.client || obj.name || `Client ${idx + 1}`;
    const companyName = obj.nomentreprise || obj.entreprise || obj.societe || obj.company || '';
    const typeStr = (obj.typeclient || obj.type || '').toString().toUpperCase();
    const type = typeStr.includes('ENTREP') || typeStr.includes('COMP') || companyName ? 'COMPANY' : 'INDIVIDUAL';
    const phone = (obj.telephone || obj.phone || obj.tel || '+243').toString().trim();
    const whatsapp = (obj.whatsapp || phone).toString().trim();
    const email = (obj.email || obj.courriel || '').toString().trim();
    const city = obj.ville || obj.city || 'Lubumbashi';
    const commune = obj.communequartier || obj.commune || obj.quartier || '';
    const address = obj.adresse || obj.address || '';
    const rccmOrNif = obj.nifourccm || obj.nif || obj.rccm || '';
    const outstandingDebtUSD = parseFloat(obj.soldedetteusd || obj.dette || obj.solde || 0) || 0;

    return {
      name,
      companyName: companyName || undefined,
      type: type as 'COMPANY' | 'INDIVIDUAL',
      phone,
      whatsapp,
      email: email || undefined,
      city,
      commune: commune || undefined,
      address: address || undefined,
      rccmOrNif: rccmOrNif || undefined,
      outstandingDebtUSD,
      totalSpentUSD: 0,
      createdAt: new Date().toISOString(),
    };
  });
}

/**
 * Convert imported raw Excel rows into Expense objects
 */
export function mapRowsToExpenses(rows: any[], exchangeRate: number = 2850): Partial<Expense>[] {
  return rows.map((row, idx) => {
    const obj: any = {};
    Object.keys(row).forEach((k) => {
      obj[normalizeKey(k)] = row[k];
    });

    const description = obj.description || obj.motif || obj.libelle || `Dépense ${idx + 1}`;
    const category = obj.categorie || obj.category || 'AUTRE';
    const amountUSD = parseFloat(obj.montantusd || obj.montant || obj.prix || 0) || 0;
    const amountCDF = Math.round(amountUSD * exchangeRate);
    const date = obj.date || new Date().toISOString().slice(0, 10);
    const paymentMethod = obj.modepaiement || obj.paiement || 'CASH_USD';
    const beneficiary = obj.beneficiaire || obj.fournisseur || '';
    const receiptRef = obj.referencepiece || obj.recu || obj.facture || '';

    return {
      description,
      category: category as any,
      amountUSD,
      amountCDF,
      exchangeRate,
      date,
      paymentMethod: paymentMethod as any,
      beneficiary: beneficiary || undefined,
      receiptRef: receiptRef || undefined,
    };
  });
}

/**
 * Convert imported raw Excel rows into NetworkEquipment objects
 */
export function mapRowsToEquipments(rows: any[]): Partial<NetworkEquipment>[] {
  return rows.map((row, idx) => {
    const obj: any = {};
    Object.keys(row).forEach((k) => {
      obj[normalizeKey(k)] = row[k];
    });

    const name = obj.nomequipement || obj.nom || obj.name || `Équipement ${idx + 1}`;
    const typeStr = (obj.type || 'STARLINK').toString().toUpperCase();
    let type: any = 'STARLINK';
    if (typeStr.includes('CCTV') || typeStr.includes('CAM')) type = 'CCTV_CAMERA';
    else if (typeStr.includes('NVR') || typeStr.includes('DVR')) type = 'NVR_DVR';
    else if (typeStr.includes('ROUT') || typeStr.includes('MIKRO')) type = 'ROUTER';
    else if (typeStr.includes('AP') || typeStr.includes('POINT') || typeStr.includes('WIFI')) type = 'ACCESS_POINT';

    const clientName = obj.client || obj.nomclient || 'Client Principal';
    const siteName = obj.site || obj.nomsite || 'Site Principal';
    const serialNumber = (obj.numeroserie || obj.serial || obj.sn || `SN-${Date.now()}-${idx}`).toString();
    const macAddress = (obj.adressemac || obj.mac || '').toString();
    const statusStr = (obj.statut || obj.status || 'ACTIVE').toString().toUpperCase();
    const status = statusStr.includes('MAINT') ? 'MAINTENANCE' : statusStr.includes('OFF') ? 'OFFLINE' : 'ACTIVE';
    const installationDate = obj.dateinstallation || obj.date || new Date().toISOString().slice(0, 10);
    const assignedTechnician = obj.technicien || obj.agent || '';
    const notes = obj.notes || obj.remarques || '';

    const eq: Partial<NetworkEquipment> = {
      name,
      type,
      clientName,
      siteName,
      serialNumber,
      macAddress: macAddress || undefined,
      status: status as any,
      installationDate,
      assignedTechnician: assignedTechnician || undefined,
      notes: notes || undefined,
    };

    if (type === 'STARLINK') {
      eq.starlink = {
        kitNumber: obj.starlinkkitnumber || 'KIT-SLK-GEN3',
        routerModel: 'Starlink Gen 3 WiFi 6',
        subscriptionPlan: obj.starlinkplan || 'Priorité Entreprise / Mobile',
        publicIpOrCgnat: obj.starlinkip || '100.64.0.1',
        wifiSsid: obj.starlinkssid || 'STARLINK-WIFI',
        bypassModeEnabled: false,
      };
    } else if (type === 'CCTV_CAMERA') {
      eq.cctvCamera = {
        brand: (obj.cameramarque || 'Hikvision'),
        model: 'Dome IP PoE HD',
        cameraType: 'DOME',
        resolution: obj.cameraresolution || '4MP (2K)',
        ipAddress: obj.cameraip || '192.168.1.150',
        httpPort: 80,
        rtspPort: 554,
        onvifPort: 8000,
        username: 'admin',
        password: 'Password@2026',
        nvrChannel: 1,
        poeSwitchPort: 'Port 1',
      };
    } else if (type === 'ROUTER') {
      eq.router = {
        brand: 'MikroTik',
        model: 'hEX / RB750Gr3',
        ipLanGateway: obj.routeriplan || '192.168.88.1/24',
        dhcpPoolRange: '192.168.88.10 - 192.168.88.250',
        wanType: 'STATIC',
        adminUsername: 'admin',
        adminPassword: 'Password@2026',
      };
    } else if (type === 'ACCESS_POINT') {
      eq.accessPoint = {
        brand: 'Ubiquiti UniFi',
        model: 'U6 Pro WiFi 6',
        ipAddress: '192.168.1.50',
        primarySsid: obj.apssid || 'WIFI-CLIENT-SECURE',
        primaryWifiPassword: 'Password@2026',
        frequencyBands: '2.4GHz / 5GHz / WiFi 6',
      };
    }

    return eq;
  });
}
