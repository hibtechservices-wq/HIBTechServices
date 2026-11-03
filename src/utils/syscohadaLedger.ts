import { Sale, Expense, AccountingEntry, SyscohadaJournalCode } from '../types';

export interface AccountLedgerItem {
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
  runningBalanceUSD: number;
  runningBalanceCDF: number;
}

export interface AccountLedgerSummary {
  accountNumber: string;
  accountLabel: string;
  accountClass: number;
  category: 'BILAN_ACTIF' | 'BILAN_PASSIF' | 'CHARGE' | 'PRODUIT';
  totalDebitUSD: number;
  totalCreditUSD: number;
  totalDebitCDF: number;
  totalCreditCDF: number;
  balanceUSD: number; // >0 débiteur, <0 créditeur
  balanceCDF: number;
  entries: AccountLedgerItem[];
}

export interface SyscohadaTrialBalanceRow {
  accountNumber: string;
  accountLabel: string;
  accountClass: number;
  totalDebitUSD: number;
  totalCreditUSD: number;
  debitBalanceUSD: number;
  creditBalanceUSD: number;
  totalDebitCDF: number;
  totalCreditCDF: number;
  debitBalanceCDF: number;
  creditBalanceCDF: number;
}

export interface SyscohadaFinancialSummary {
  totalRevenueUSD: number;
  totalRevenueCDF: number;
  totalExpensesUSD: number;
  totalExpensesCDF: number;
  netOperatingIncomeUSD: number;
  netOperatingIncomeCDF: number;
  totalTreasuryUSD: number;
  totalTreasuryCDF: number;
  totalReceivablesUSD: number; // Créances clients 411
  totalPayablesUSD: number;    // Dettes fournisseurs 401
  isBalanced: boolean;
  totalDebitsUSD: number;
  totalCreditsUSD: number;
}

/**
 * Compile all synchronized SYSCOHADA accounting entries from:
 * 1. Sales (Journal des Ventes VT - Débit 411 / Crédit 701/706 & 443)
 * 2. Payments (Journal Trésorerie CA - Débit 571/585/521 / Crédit 411)
 * 3. Expenses (Journal Dépenses ACH/DEP - Débit 601/605/614/622/661 / Crédit 571/521)
 * 4. Custom Journal Entries (OD)
 */
export function generateAllAccountingEntries(
  sales: Sale[],
  expenses: Expense[],
  customEntries: AccountingEntry[],
  exchangeRate: number
): AccountingEntry[] {
  const entries: AccountingEntry[] = [];
  const rate = exchangeRate || 2850;

  // 1. Ventes (VT)
  sales.forEach((sale) => {
    const saleDate = sale.createdAt ? sale.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const piece = sale.saleNumber;
    const clientName = sale.clientName || 'Client Comptoir';
    const totalUSD = sale.totalUSD;
    const totalCDF = sale.totalCDF || Math.round(totalUSD * rate);
    const taxUSD = sale.taxAmountUSD || 0;
    const taxCDF = Math.round(taxUSD * rate);
    const htUSD = sale.subtotalUSD || (totalUSD - taxUSD);
    const htCDF = Math.round(htUSD * rate);

    // Débit 411100 (Clients) - Montant TTC
    entries.push({
      id: `vt-deb-${sale.id}`,
      date: saleDate,
      journal: 'VT',
      journalLabel: 'Ventes',
      pieceRef: piece,
      accountNumber: '411100',
      accountLabel: `Clients RDC - ${clientName}`,
      description: `Facture ${piece} · ${clientName}`,
      debitUSD: totalUSD,
      creditUSD: 0,
      debitCDF: totalCDF,
      creditCDF: 0,
      exchangeRate: rate,
      sourceType: 'SALE',
      sourceId: sale.id,
      createdAt: sale.createdAt,
    });

    // Crédit 701100 (Marchandises) ou 706000 (Prestations Services) - Montant HT
    const isService = sale.items.some((it) => it.type === 'SERVICE');
    const salesAccount = isService ? '706000' : '701100';
    const salesLabel = isService
      ? 'Prestations de services vendues'
      : 'Ventes de marchandises en RDC';

    entries.push({
      id: `vt-cred-rev-${sale.id}`,
      date: saleDate,
      journal: 'VT',
      journalLabel: 'Ventes',
      pieceRef: piece,
      accountNumber: salesAccount,
      accountLabel: salesLabel,
      description: `Chiffre d'affaires HT ${piece}`,
      debitUSD: 0,
      creditUSD: htUSD,
      debitCDF: 0,
      creditCDF: htCDF,
      exchangeRate: rate,
      sourceType: 'SALE',
      sourceId: sale.id,
      createdAt: sale.createdAt,
    });

    // Crédit 443100 (TVA Collectée DGI 16%) si applicable
    if (taxUSD > 0) {
      entries.push({
        id: `vt-cred-tax-${sale.id}`,
        date: saleDate,
        journal: 'VT',
        journalLabel: 'Ventes',
        pieceRef: piece,
        accountNumber: '443100',
        accountLabel: 'État, TVA facturée sur ventes (16% DGI)',
        description: `TVA 16% collectée DGI ${piece}`,
        debitUSD: 0,
        creditUSD: taxUSD,
        debitCDF: 0,
        creditCDF: taxCDF,
        exchangeRate: rate,
        sourceType: 'SALE',
        sourceId: sale.id,
        createdAt: sale.createdAt,
      });
    }
  });

  // 2. Encaissements & Règlements (CA / TR)
  sales.forEach((sale) => {
    (sale.paymentHistory || []).forEach((payment) => {
      if (payment.amountUSD > 0) {
        const payDate = payment.date ? payment.date.slice(0, 10) : sale.createdAt.slice(0, 10);
        const piece = payment.reference || `REG-${sale.saleNumber}`;
        const paidUSD = payment.amountUSD;
        const paidCDF = payment.amountCDF || Math.round(paidUSD * rate);

        let treasuryAcc = '571100';
        let treasuryLabel = 'Caisse principale USD';

        switch (payment.method) {
          case 'CASH_CDF':
            treasuryAcc = '571200';
            treasuryLabel = 'Caisse principale CDF (Francs Congolais)';
            break;
          case 'MPESA':
            treasuryAcc = '585100';
            treasuryLabel = 'Vodacom M-Pesa Mobile Money';
            break;
          case 'ORANGE_MONEY':
            treasuryAcc = '585200';
            treasuryLabel = 'Orange Money RDC';
            break;
          case 'AIRTEL_MONEY':
            treasuryAcc = '585300';
            treasuryLabel = 'Airtel Money RDC';
            break;
          case 'AFRIMONEY':
            treasuryAcc = '585400';
            treasuryLabel = 'Africell Afrimoney';
            break;
          case 'BANK_TRANSFER':
            treasuryAcc = '521100';
            treasuryLabel = 'Banque Commerciale RDC';
            break;
          default:
            treasuryAcc = '571100';
            treasuryLabel = 'Caisse USD';
            break;
        }

        // Débit compte de trésorerie
        entries.push({
          id: `ca-deb-${payment.id}`,
          date: payDate,
          journal: 'CA',
          journalLabel: 'Trésorerie',
          pieceRef: piece,
          accountNumber: treasuryAcc,
          accountLabel: treasuryLabel,
          description: `Règlement ${payment.method} · ${sale.clientName} (${sale.saleNumber})`,
          debitUSD: paidUSD,
          creditUSD: 0,
          debitCDF: paidCDF,
          creditCDF: 0,
          exchangeRate: rate,
          sourceType: 'PAYMENT',
          sourceId: payment.id,
          createdAt: payment.date || sale.createdAt,
        });

        // Crédit compte client 411100 pour solder
        entries.push({
          id: `ca-cred-${payment.id}`,
          date: payDate,
          journal: 'CA',
          journalLabel: 'Trésorerie',
          pieceRef: piece,
          accountNumber: '411100',
          accountLabel: `Clients RDC - ${sale.clientName}`,
          description: `Règlement reçu sur facture ${sale.saleNumber}`,
          debitUSD: 0,
          creditUSD: paidUSD,
          debitCDF: 0,
          creditCDF: paidCDF,
          exchangeRate: rate,
          sourceType: 'PAYMENT',
          sourceId: payment.id,
          createdAt: payment.date || sale.createdAt,
        });
      }
    });

    // Fallback: si pas de paymentHistory explicite mais amountPaidUSD > 0
    if ((!sale.paymentHistory || sale.paymentHistory.length === 0) && sale.amountPaidUSD > 0) {
      const payDate = sale.createdAt ? sale.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const piece = `REG-${sale.saleNumber}`;
      const paidUSD = sale.amountPaidUSD;
      const paidCDF = Math.round(paidUSD * rate);

      const treasuryAcc = sale.paymentMethod === 'CASH_CDF' ? '571200' : '571100';
      const treasuryLabel = sale.paymentMethod === 'CASH_CDF' ? 'Caisse principale CDF' : 'Caisse principale USD';

      entries.push({
        id: `ca-deb-direct-${sale.id}`,
        date: payDate,
        journal: 'CA',
        journalLabel: 'Trésorerie',
        pieceRef: piece,
        accountNumber: treasuryAcc,
        accountLabel: treasuryLabel,
        description: `Encaissement comptant ${sale.saleNumber}`,
        debitUSD: paidUSD,
        creditUSD: 0,
        debitCDF: paidCDF,
        creditCDF: 0,
        exchangeRate: rate,
        sourceType: 'PAYMENT',
        sourceId: sale.id,
        createdAt: sale.createdAt,
      });

      entries.push({
        id: `ca-cred-direct-${sale.id}`,
        date: payDate,
        journal: 'CA',
        journalLabel: 'Trésorerie',
        pieceRef: piece,
        accountNumber: '411100',
        accountLabel: `Clients RDC - ${sale.clientName}`,
        description: `Solde encaissement direct ${sale.saleNumber}`,
        debitUSD: 0,
        creditUSD: paidUSD,
        debitCDF: 0,
        creditCDF: paidCDF,
        exchangeRate: rate,
        sourceType: 'PAYMENT',
        sourceId: sale.id,
        createdAt: sale.createdAt,
      });
    }
  });

  // 3. Dépenses d'exploitation (ACH / DEP)
  expenses.forEach((exp) => {
    const expDate = exp.date ? exp.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const piece = exp.receiptRef || `DEP-${exp.id.slice(0, 6).toUpperCase()}`;
    const expUSD = exp.amountUSD;
    const expCDF = exp.amountCDF || Math.round(expUSD * rate);

    let expenseAcc = '605000';
    let expenseLabel = `Charges d'exploitation - ${exp.category}`;

    if (exp.category === 'LOYER') {
      expenseAcc = '622000';
      expenseLabel = 'Locations et charges locatives';
    } else if (exp.category === 'SALAIRES') {
      expenseAcc = '661000';
      expenseLabel = 'Rémunérations directes du personnel';
    } else if (exp.category === 'TRANSPORT') {
      expenseAcc = '614000';
      expenseLabel = 'Transports et déplacements professionnels';
    } else if (exp.category === 'ELECTRICITE_CARBURANT') {
      expenseAcc = '605000';
      expenseLabel = 'Électricité, carburant et matières';
    } else if (exp.category === 'COMMUNICATION') {
      expenseAcc = '628000';
      expenseLabel = 'Frais de télécommunications, Internet & Starlink';
    } else if (exp.category === 'IMPOTS_TAXES') {
      expenseAcc = '641000';
      expenseLabel = 'Impôts, taxes et droits assimilés';
    }

    // Débit compte de charge (Classe 6)
    entries.push({
      id: `dep-deb-${exp.id}`,
      date: expDate,
      journal: 'ACH',
      journalLabel: 'Dépenses',
      pieceRef: piece,
      accountNumber: expenseAcc,
      accountLabel: expenseLabel,
      description: `${exp.description || 'Dépense'} [${exp.category}]`,
      debitUSD: expUSD,
      creditUSD: 0,
      debitCDF: expCDF,
      creditCDF: 0,
      exchangeRate: rate,
      sourceType: 'EXPENSE',
      sourceId: exp.id,
      createdAt: exp.date,
    });

    // Crédit compte de trésorerie (Caisse ou Banque)
    const isBank = exp.paymentMethod === 'BANK_TRANSFER';
    const treasuryAcc = isBank ? '521100' : '571100';
    const treasuryLabel = isBank ? 'Banque Commerciale RDC' : 'Caisse Principale USD';

    entries.push({
      id: `dep-cred-${exp.id}`,
      date: expDate,
      journal: 'ACH',
      journalLabel: 'Dépenses',
      pieceRef: piece,
      accountNumber: treasuryAcc,
      accountLabel: treasuryLabel,
      description: `Règlement ${exp.description || 'dépense'} (${exp.paymentMethod})`,
      debitUSD: 0,
      creditUSD: expUSD,
      debitCDF: 0,
      creditCDF: expCDF,
      exchangeRate: rate,
      sourceType: 'EXPENSE',
      sourceId: exp.id,
      createdAt: exp.date,
    });
  });

  // 4. Écritures manuelles d'OD (Opérations Diverses)
  customEntries.forEach((ce) => {
    entries.push({
      ...ce,
      exchangeRate: ce.exchangeRate || rate,
    });
  });

  // Tri chronologique décroissant (plus récentes en premier)
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Calcul du Grand Livre des Comptes (General Ledger)
 */
export function buildGeneralLedger(entries: AccountingEntry[]): AccountLedgerSummary[] {
  const map = new Map<string, AccountLedgerSummary>();

  // Trier par date croissante pour calculer le solde progressif
  const sortedAsc = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedAsc.forEach((entry) => {
    const accNum = entry.accountNumber;
    if (!map.has(accNum)) {
      const firstDigit = parseInt(accNum.charAt(0), 10) || 4;
      let category: 'BILAN_ACTIF' | 'BILAN_PASSIF' | 'CHARGE' | 'PRODUIT' = 'BILAN_ACTIF';
      if (firstDigit === 1 || firstDigit === 4) {
        category = accNum.startsWith('40') || accNum.startsWith('443') ? 'BILAN_PASSIF' : 'BILAN_ACTIF';
      } else if (firstDigit === 6) {
        category = 'CHARGE';
      } else if (firstDigit === 7) {
        category = 'PRODUIT';
      } else if (firstDigit === 5 || firstDigit === 2 || firstDigit === 3) {
        category = 'BILAN_ACTIF';
      }

      map.set(accNum, {
        accountNumber: accNum,
        accountLabel: entry.accountLabel,
        accountClass: firstDigit,
        category,
        totalDebitUSD: 0,
        totalCreditUSD: 0,
        totalDebitCDF: 0,
        totalCreditCDF: 0,
        balanceUSD: 0,
        balanceCDF: 0,
        entries: [],
      });
    }

    const item = map.get(accNum)!;
    item.totalDebitUSD += entry.debitUSD;
    item.totalCreditUSD += entry.creditUSD;
    item.totalDebitCDF += entry.debitCDF;
    item.totalCreditCDF += entry.creditCDF;

    const runningBalUSD = item.totalDebitUSD - item.totalCreditUSD;
    const runningBalCDF = item.totalDebitCDF - item.totalCreditCDF;

    item.balanceUSD = runningBalUSD;
    item.balanceCDF = runningBalCDF;

    item.entries.push({
      ...entry,
      runningBalanceUSD: runningBalUSD,
      runningBalanceCDF: runningBalCDF,
    });
  });

  return Array.from(map.values()).sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
}

/**
 * Calcul de la Balance Générale à 6 colonnes (Trial Balance)
 */
export function buildTrialBalance(ledger: AccountLedgerSummary[]): SyscohadaTrialBalanceRow[] {
  return ledger.map((item) => {
    const soldeUSD = item.totalDebitUSD - item.totalCreditUSD;
    const soldeCDF = item.totalDebitCDF - item.totalCreditCDF;

    return {
      accountNumber: item.accountNumber,
      accountLabel: item.accountLabel,
      accountClass: item.accountClass,
      totalDebitUSD: item.totalDebitUSD,
      totalCreditUSD: item.totalCreditUSD,
      debitBalanceUSD: soldeUSD > 0 ? soldeUSD : 0,
      creditBalanceUSD: soldeUSD < 0 ? Math.abs(soldeUSD) : 0,
      totalDebitCDF: item.totalDebitCDF,
      totalCreditCDF: item.totalCreditCDF,
      debitBalanceCDF: soldeCDF > 0 ? soldeCDF : 0,
      creditBalanceCDF: soldeCDF < 0 ? Math.abs(soldeCDF) : 0,
    };
  });
}

/**
 * Synthèse financière comptable globale
 */
export function calculateAccountingFinancialSummary(
  entries: AccountingEntry[],
  ledger: AccountLedgerSummary[],
  rate: number
): SyscohadaFinancialSummary {
  let totalRevenueUSD = 0;
  let totalExpensesUSD = 0;
  let totalDebitsUSD = 0;
  let totalCreditsUSD = 0;
  let totalTreasuryUSD = 0;
  let totalReceivablesUSD = 0;
  let totalPayablesUSD = 0;

  entries.forEach((e) => {
    totalDebitsUSD += e.debitUSD;
    totalCreditsUSD += e.creditUSD;
  });

  ledger.forEach((acc) => {
    // Classe 7: Produits (Revenue)
    if (acc.accountClass === 7) {
      totalRevenueUSD += (acc.totalCreditUSD - acc.totalDebitUSD);
    }
    // Classe 6: Charges (Expenses)
    if (acc.accountClass === 6) {
      totalExpensesUSD += (acc.totalDebitUSD - acc.totalCreditUSD);
    }
    // Classe 5: Trésorerie
    if (acc.accountClass === 5) {
      totalTreasuryUSD += acc.balanceUSD;
    }
    // Compte 411: Clients (Créances)
    if (acc.accountNumber.startsWith('411')) {
      totalReceivablesUSD += Math.max(0, acc.balanceUSD);
    }
    // Compte 401: Fournisseurs (Dettes)
    if (acc.accountNumber.startsWith('401')) {
      totalPayablesUSD += Math.max(0, -acc.balanceUSD);
    }
  });

  const netOperatingIncomeUSD = totalRevenueUSD - totalExpensesUSD;
  const isBalanced = Math.abs(totalDebitsUSD - totalCreditsUSD) < 0.05;

  return {
    totalRevenueUSD,
    totalRevenueCDF: Math.round(totalRevenueUSD * rate),
    totalExpensesUSD,
    totalExpensesCDF: Math.round(totalExpensesUSD * rate),
    netOperatingIncomeUSD,
    netOperatingIncomeCDF: Math.round(netOperatingIncomeUSD * rate),
    totalTreasuryUSD,
    totalTreasuryCDF: Math.round(totalTreasuryUSD * rate),
    totalReceivablesUSD,
    totalPayablesUSD,
    isBalanced,
    totalDebitsUSD,
    totalCreditsUSD,
  };
}
