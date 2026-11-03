import { SyscohadaAccount } from '../types';

/**
 * Plan Comptable Général Révisé (SYSCOHADA)
 * Applicable en République Démocratique du Congo (RDC)
 * Classes 1 à 7
 */
export const syscohadaChartOfAccounts: SyscohadaAccount[] = [
  // ==========================================================================
  // CLASSE 1 : COMPTES DE RESSOURCES DURABLES (CAPITAUX PROPRES & DETTES FINANCIERES)
  // ==========================================================================
  {
    accountNumber: '101100',
    accountClass: 1,
    label: 'Capital souscrit, non appelé',
    category: 'BILAN_PASSIF',
    description: 'Fonds propres de la société',
  },
  {
    accountNumber: '101300',
    accountClass: 1,
    label: 'Capital souscrit, appelé, versé, non amorti',
    category: 'BILAN_PASSIF',
    description: 'Capital social libéré',
  },
  {
    accountNumber: '111000',
    accountClass: 1,
    label: 'Réserve légale',
    category: 'BILAN_PASSIF',
    description: 'Prélèvement obligatoire de 10% sur les bénéfices',
  },
  {
    accountNumber: '121000',
    accountClass: 1,
    label: 'Report à nouveau créditeur',
    category: 'BILAN_PASSIF',
    description: 'Bénéfices antérieurs non distribués',
  },
  {
    accountNumber: '131000',
    accountClass: 1,
    label: "Résultat net de l'exercice (Bénéfice)",
    category: 'BILAN_PASSIF',
    description: "Solde créditeur de l'exercice en cours",
  },
  {
    accountNumber: '162000',
    accountClass: 1,
    label: 'Emprunts auprès des établissements de crédit',
    category: 'BILAN_PASSIF',
    description: 'Dettes bancaires à moyen et long terme',
  },

  // ==========================================================================
  // CLASSE 2 : COMPTES D'ACTIF IMMOBILISÉ (IMMOBILISATIONS)
  // ==========================================================================
  {
    accountNumber: '213000',
    accountClass: 2,
    label: 'Logiciels informatiques et licences',
    category: 'BILAN_ACTIF',
    description: 'Immobilisations incorporelles (progiciels, licences)',
  },
  {
    accountNumber: '241100',
    accountClass: 2,
    label: 'Matériel de bureau',
    category: 'BILAN_ACTIF',
    description: 'Mobilier et équipements administratifs',
  },
  {
    accountNumber: '241200',
    accountClass: 2,
    label: 'Matériel informatique et télécoms',
    category: 'BILAN_ACTIF',
    description: 'Serveurs, routeurs, terminaux Starlink, PC caisse',
  },
  {
    accountNumber: '245000',
    accountClass: 2,
    label: 'Matériel de transport',
    category: 'BILAN_ACTIF',
    description: 'Véhicules et motos de livraison/service',
  },
  {
    accountNumber: '284100',
    accountClass: 2,
    label: 'Amortissements du matériel informatique',
    category: 'BILAN_ACTIF',
    description: 'Amortissement cumulé des équipements',
  },

  // ==========================================================================
  // CLASSE 3 : COMPTES DE STOCKS
  // ==========================================================================
  {
    accountNumber: '311100',
    accountClass: 3,
    label: 'Marchandises en stock (Entrepôt principal)',
    category: 'BILAN_ACTIF',
    description: 'Articles et équipements destinés à la revente',
  },
  {
    accountNumber: '321000',
    accountClass: 3,
    label: 'Matières consommables et fournitures',
    category: 'BILAN_ACTIF',
    description: 'Câbles, connecteurs RJ45, consommables caisse',
  },

  // ==========================================================================
  // CLASSE 4 : COMPTES DE TIERS (CLIENTS, FOURNISSEURS, ÉTAT, PERSONNEL)
  // ==========================================================================
  {
    accountNumber: '401100',
    accountClass: 4,
    label: 'Fournisseurs d’exploitation RDC',
    category: 'BILAN_PASSIF',
    description: 'Dettes fournisseurs pour achats de marchandises',
  },
  {
    accountNumber: '411100',
    accountClass: 4,
    label: 'Clients ordinaires RDC (Créances Ventes)',
    category: 'BILAN_ACTIF',
    description: 'Factures de vente émises non encore soldées',
  },
  {
    accountNumber: '411200',
    accountClass: 4,
    label: 'Clients Comptoir (Ventes au comptant)',
    category: 'BILAN_ACTIF',
    description: 'Ventes immédiates payées à la caisse',
  },
  {
    accountNumber: '421000',
    accountClass: 4,
    label: 'Personnel, rémunérations dues',
    category: 'BILAN_PASSIF',
    description: 'Salaires et commissions à verser aux agents',
  },
  {
    accountNumber: '431000',
    accountClass: 4,
    label: 'Sécurité sociale (CNSS RDC)',
    category: 'BILAN_PASSIF',
    description: 'Cotisations sociales patronales et salariales CNSS',
  },
  {
    accountNumber: '442100',
    accountClass: 4,
    label: 'État, impôts retenus à la source (IPR / IERE)',
    category: 'BILAN_PASSIF',
    description: 'Impôt professionnel sur les rémunérations DGI',
  },
  {
    accountNumber: '443100',
    accountClass: 4,
    label: 'État, TVA facturée sur ventes (16% DGI)',
    category: 'BILAN_PASSIF',
    description: 'TVA 16% collectée sur factures et tickets normalisés',
  },
  {
    accountNumber: '444100',
    accountClass: 4,
    label: 'État, TVA déductible sur achats et services',
    category: 'BILAN_ACTIF',
    description: 'TVA payée sur acquisitions récupérables',
  },
  {
    accountNumber: '445000',
    accountClass: 4,
    label: 'État, TVA due (Solde mensuel déclaration DGI)',
    category: 'BILAN_PASSIF',
    description: 'Montant net de TVA à payer avant le 15 du mois',
  },

  // ==========================================================================
  // CLASSE 5 : COMPTES DE TRÉSORERIE (CAISSE, BANQUES, MOBILE MONEY)
  // ==========================================================================
  {
    accountNumber: '521100',
    accountClass: 5,
    label: 'Banque Commerciale RDC (Compte Courant USD)',
    category: 'BILAN_ACTIF',
    description: 'Compte bancaire principal en devise',
  },
  {
    accountNumber: '521200',
    accountClass: 5,
    label: 'Banque Commerciale RDC (Compte Courant CDF)',
    category: 'BILAN_ACTIF',
    description: 'Compte bancaire en Franc Congolais',
  },
  {
    accountNumber: '571100',
    accountClass: 5,
    label: 'Caisse Principale USD (Tiroir-caisse)',
    category: 'BILAN_ACTIF',
    description: 'Espèces physiques en Dollars Américains',
  },
  {
    accountNumber: '571200',
    accountClass: 5,
    label: 'Caisse Principale CDF (Francs Congolais)',
    category: 'BILAN_ACTIF',
    description: 'Espèces physiques en Francs Congolais',
  },
  {
    accountNumber: '585100',
    accountClass: 5,
    label: 'Trésorerie Mobile Money - Vodacom M-Pesa',
    category: 'BILAN_ACTIF',
    description: 'Portefeuille marchand M-Pesa',
  },
  {
    accountNumber: '585200',
    accountClass: 5,
    label: 'Trésorerie Mobile Money - Orange Money RDC',
    category: 'BILAN_ACTIF',
    description: 'Portefeuille marchand Orange Money',
  },
  {
    accountNumber: '585300',
    accountClass: 5,
    label: 'Trésorerie Mobile Money - Airtel Money RDC',
    category: 'BILAN_ACTIF',
    description: 'Portefeuille marchand Airtel Money',
  },
  {
    accountNumber: '585400',
    accountClass: 5,
    label: 'Trésorerie Mobile Money - Africell Afrimoney',
    category: 'BILAN_ACTIF',
    description: 'Portefeuille marchand Afrimoney',
  },
  {
    accountNumber: '581000',
    accountClass: 5,
    label: 'Virements internes de fonds',
    category: 'BILAN_ACTIF',
    description: 'Compte de passage pour transferts Caisse <-> Banque/MM',
  },

  // ==========================================================================
  // CLASSE 6 : COMPTES DE CHARGES (ACHATS, FRAIS, SERVICES, SALAIRES)
  // ==========================================================================
  {
    accountNumber: '601100',
    accountClass: 6,
    label: 'Achats de marchandises (Stockées)',
    category: 'CHARGE',
    description: 'Approvisionnements kits Starlink, câbles, accessoires',
  },
  {
    accountNumber: '605000',
    accountClass: 6,
    label: "Autres achats de matières et fournitures d'exploitation",
    category: 'CHARGE',
    description: 'Fournitures de bureau, rouleaux thermiques 80mm',
  },
  {
    accountNumber: '614000',
    accountClass: 6,
    label: 'Transports et déplacements professionnels',
    category: 'CHARGE',
    description: 'Frais de transport sur interventions techniques',
  },
  {
    accountNumber: '622000',
    accountClass: 6,
    label: 'Locations et charges locatives',
    category: 'CHARGE',
    description: 'Loyer des bureaux et locaux commerciaux',
  },
  {
    accountNumber: '624000',
    accountClass: 6,
    label: 'Entretien, réparations et maintenance',
    category: 'CHARGE',
    description: 'Maintenance des installations et outillages',
  },
  {
    accountNumber: '628000',
    accountClass: 6,
    label: 'Frais de télécommunications, Internet & Starlink',
    category: 'CHARGE',
    description: 'Abonnements data, liaisons satellite, téléphonie',
  },
  {
    accountNumber: '631000',
    accountClass: 6,
    label: 'Frais bancaires et commissions sur paiements électroniques',
    category: 'CHARGE',
    description: 'Frais de tenue de compte, commissions Mobile Money',
  },
  {
    accountNumber: '641000',
    accountClass: 6,
    label: 'Impôts, taxes et droits assimilés',
    category: 'CHARGE',
    description: 'Patente communale, taxes DGRK/provinciales, vignettes',
  },
  {
    accountNumber: '661000',
    accountClass: 6,
    label: 'Rémunérations directes du personnel',
    category: 'CHARGE',
    description: 'Salaires de base, primes et indemnités',
  },
  {
    accountNumber: '681000',
    accountClass: 6,
    label: 'Dotations aux amortissements d’exploitation',
    category: 'CHARGE',
    description: 'Amortissement annuel des immobilisations',
  },

  // ==========================================================================
  // CLASSE 7 : COMPTES DE PRODUITS (VENTES & PRESTATIONS DE SERVICES)
  // ==========================================================================
  {
    accountNumber: '701100',
    accountClass: 7,
    label: 'Ventes de marchandises en RDC (Matériel & Équipements)',
    category: 'PRODUIT',
    description: 'Ventes de kits satellites, accessoires, câblage',
  },
  {
    accountNumber: '706000',
    accountClass: 7,
    label: 'Prestations de services vendues (Installations & Maintenance)',
    category: 'PRODUIT',
    description: 'Installation paraboles, configuration réseaux, support',
  },
  {
    accountNumber: '707000',
    accountClass: 7,
    label: 'Produits accessoires et frais facturés',
    category: 'PRODUIT',
    description: 'Frais de transport ou logistique refacturés au client',
  },
  {
    accountNumber: '758000',
    accountClass: 7,
    label: 'Produits divers de gestion courante',
    category: 'PRODUIT',
    description: 'Recettes exceptionnelles ou accessoires',
  },
  {
    accountNumber: '776000',
    accountClass: 7,
    label: 'Gains de change sur devises (USD / CDF)',
    category: 'PRODUIT',
    description: 'Écarts positifs de conversion monétaire BCC',
  },
];
