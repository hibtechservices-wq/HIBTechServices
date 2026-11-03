import { Sale, Expense, CompanySettings } from '../types';
import { exportToExcel } from './excelUtils';

/**
 * Générateur de Journal Comptable conforme au Système Comptable OHADA révisé (SYSCOHADA)
 * applicable en République Démocratique du Congo.
 */
export function exportSyscohadaJournal(
  sales: Sale[],
  expenses: Expense[],
  settings: CompanySettings,
  rateUSD_CDF: number
) {
  const companyName = settings.name || 'Entreprise RDC';
  const nif = settings.nif || 'NIF NON RENSEIGNÉ';
  const currentDate = new Date().toISOString().slice(0, 10);

  // --------------------------------------------------------------------------
  // 1. JOURNAL DES VENTES (SYSCOHADA - Comptes 701, 706, 443, 411)
  // --------------------------------------------------------------------------
  const salesJournalRows: any[] = [];

  sales.forEach((sale) => {
    const saleDate = sale.createdAt ? sale.createdAt.slice(0, 10) : currentDate;
    const piece = sale.saleNumber;
    const clientName = sale.clientName || 'Client Comptoir';
    const totalUSD = sale.totalUSD;
    const totalCDF = sale.totalCDF || Math.round(totalUSD * rateUSD_CDF);
    const taxUSD = sale.taxAmountUSD || 0;
    const taxCDF = Math.round(taxUSD * rateUSD_CDF);
    const htUSD = sale.subtotalUSD || (totalUSD - taxUSD);
    const htCDF = Math.round(htUSD * rateUSD_CDF);

    // Débit Compte 411100 (Clients) pour le montant TTC
    salesJournalRows.push({
      Date: saleDate,
      Journal: 'VT - VENTES',
      NumPiece: piece,
      CompteOHADA: '411100',
      IntituleCompte: `Clients RDC - ${clientName}`,
      LibelleOperation: `Facturation client ${clientName} - ${piece}`,
      DebitUSD: totalUSD,
      CreditUSD: 0,
      DebitCDF: totalCDF,
      CreditCDF: 0,
      TauxBCC: rateUSD_CDF,
    });

    // Crédit Compte 701100 (Ventes Marchandises) ou 706000 (Prestations Services)
    const salesAccount = sale.items.some(it => it.type === 'SERVICE') ? '706000' : '701100';
    const salesAccountLabel = salesAccount === '706000' ? 'Prestations de services vendues' : 'Ventes de marchandises';

    salesJournalRows.push({
      Date: saleDate,
      Journal: 'VT - VENTES',
      NumPiece: piece,
      CompteOHADA: salesAccount,
      IntituleCompte: salesAccountLabel,
      LibelleOperation: `Ventes nettes HT ${piece}`,
      DebitUSD: 0,
      CreditUSD: htUSD,
      DebitCDF: 0,
      CreditCDF: htCDF,
      TauxBCC: rateUSD_CDF,
    });

    // Crédit Compte 443100 (État - TVA Facturée) si TVA applicable
    if (taxUSD > 0) {
      salesJournalRows.push({
        Date: saleDate,
        Journal: 'VT - VENTES',
        NumPiece: piece,
        CompteOHADA: '443100',
        IntituleCompte: 'État, TVA facturée sur ventes (DGI 16%)',
        LibelleOperation: `TVA collectée DGI ${piece}`,
        DebitUSD: 0,
        CreditUSD: taxUSD,
        DebitCDF: 0,
        CreditCDF: taxCDF,
        TauxBCC: rateUSD_CDF,
      });
    }
  });

  // --------------------------------------------------------------------------
  // 2. JOURNAL DES ENCAISSEMENTS & TRESORERIE (SYSCOHADA - Comptes 571, 521, 585)
  // --------------------------------------------------------------------------
  const treasuryJournalRows: any[] = [];

  sales.forEach((sale) => {
    if (sale.amountPaidUSD > 0) {
      const regDate = sale.createdAt ? sale.createdAt.slice(0, 10) : currentDate;
      const piece = `REG-${sale.saleNumber}`;
      const paidUSD = sale.amountPaidUSD;
      const paidCDF = Math.round(paidUSD * rateUSD_CDF);

      // Identifier le compte de trésorerie OHADA selon le mode de paiement
      let compteTresorerie = '571100';
      let intituleTresorerie = 'Caisse principale USD';

      switch (sale.paymentMethod) {
        case 'CASH_CDF':
          compteTresorerie = '571200';
          intituleTresorerie = 'Caisse principale CDF (Francs Congolais)';
          break;
        case 'MPESA':
          compteTresorerie = '585100';
          intituleTresorerie = 'Vodacom M-Pesa Mobile Money';
          break;
        case 'ORANGE_MONEY':
          compteTresorerie = '585200';
          intituleTresorerie = 'Orange Money RDC';
          break;
        case 'AIRTEL_MONEY':
          compteTresorerie = '585300';
          intituleTresorerie = 'Airtel Money RDC';
          break;
        case 'AFRIMONEY':
          compteTresorerie = '585400';
          intituleTresorerie = 'Africell Afrimoney';
          break;
        case 'BANK_TRANSFER':
          compteTresorerie = '521100';
          intituleTresorerie = 'Banque Commerciale RDC';
          break;
        default:
          compteTresorerie = '571100';
          intituleTresorerie = 'Caisse USD';
          break;
      }

      // Débit compte trésorerie
      treasuryJournalRows.push({
        Date: regDate,
        Journal: 'CA - ENCAISSEMENTS',
        NumPiece: piece,
        CompteOHADA: compteTresorerie,
        IntituleCompte: intituleTresorerie,
        LibelleOperation: `Encaissement ${sale.paymentMethod} - ${sale.clientName} (${sale.saleNumber})`,
        DebitUSD: paidUSD,
        CreditUSD: 0,
        DebitCDF: paidCDF,
        CreditCDF: 0,
        TauxBCC: rateUSD_CDF,
      });

      // Crédit compte client 411100 pour solder
      treasuryJournalRows.push({
        Date: regDate,
        Journal: 'CA - ENCAISSEMENTS',
        NumPiece: piece,
        CompteOHADA: '411100',
        IntituleCompte: `Clients RDC - ${sale.clientName}`,
        LibelleOperation: `Règlement facture ${sale.saleNumber}`,
        DebitUSD: 0,
        CreditUSD: paidUSD,
        DebitCDF: 0,
        CreditCDF: paidCDF,
        TauxBCC: rateUSD_CDF,
      });
    }
  });

  // Ajouter également les dépenses enregistrées dans le journal de trésorerie
  expenses.forEach((exp) => {
    const expDate = exp.date ? exp.date.slice(0, 10) : currentDate;
    const piece = `DEP-${exp.id.slice(0, 6).toUpperCase()}`;
    const expUSD = exp.amountUSD;
    const expCDF = Math.round(expUSD * rateUSD_CDF);

    // Compte de charge OHADA
    let compteCharge = '605000';
    let intituleCharge = `Charges d'exploitation - ${exp.category || 'Autres services'}`;
    if (exp.category?.toLowerCase().includes('loyer')) {
      compteCharge = '622000';
      intituleCharge = 'Locations et charges locatives';
    } else if (exp.category?.toLowerCase().includes('salaire')) {
      compteCharge = '661000';
      intituleCharge = 'Rémunérations directes du personnel';
    } else if (exp.category?.toLowerCase().includes('transport') || exp.category?.toLowerCase().includes('carburant')) {
      compteCharge = '614000';
      intituleCharge = 'Transports et déplacements';
    }

    // Débit charge
    treasuryJournalRows.push({
      Date: expDate,
      Journal: 'OD/DEP - DEPENSES',
      NumPiece: piece,
      CompteOHADA: compteCharge,
      IntituleCompte: intituleCharge,
      LibelleOperation: `${exp.description || 'Dépense'} [${exp.category}]`,
      DebitUSD: expUSD,
      CreditUSD: 0,
      DebitCDF: expCDF,
      CreditCDF: 0,
      TauxBCC: rateUSD_CDF,
    });

    // Crédit caisse ou banque
    const isBank = exp.paymentMethod === 'BANK_TRANSFER';
    const compteReglement = isBank ? '521100' : '571100';
    treasuryJournalRows.push({
      Date: expDate,
      Journal: 'OD/DEP - DEPENSES',
      NumPiece: piece,
      CompteOHADA: compteReglement,
      IntituleCompte: isBank ? 'Banque RDC' : 'Caisse Espèces',
      LibelleOperation: `Paiement ${exp.description || 'dépense'}`,
      DebitUSD: 0,
      CreditUSD: expUSD,
      DebitCDF: 0,
      CreditCDF: expCDF,
      TauxBCC: rateUSD_CDF,
    });
  });

  // --------------------------------------------------------------------------
  // 3. BALANCE COMPTABLE SYNTHETIQUE SYSCOHADA
  // --------------------------------------------------------------------------
  const allAccountsMap = new Map<string, { label: string; debitUSD: number; creditUSD: number; debitCDF: number; creditCDF: number }>();

  const accumulate = (compte: string, label: string, dUSD: number, cUSD: number, dCDF: number, cCDF: number) => {
    if (!allAccountsMap.has(compte)) {
      allAccountsMap.set(compte, { label, debitUSD: 0, creditUSD: 0, debitCDF: 0, creditCDF: 0 });
    }
    const acc = allAccountsMap.get(compte)!;
    acc.debitUSD += dUSD;
    acc.creditUSD += cUSD;
    acc.debitCDF += dCDF;
    acc.creditCDF += cCDF;
  };

  [...salesJournalRows, ...treasuryJournalRows].forEach(row => {
    accumulate(row.CompteOHADA, row.IntituleCompte, row.DebitUSD, row.CreditUSD, row.DebitCDF, row.CreditCDF);
  });

  const balanceRows: any[] = [];
  Array.from(allAccountsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([compte, data]) => {
      const soldeUSD = data.debitUSD - data.creditUSD;
      const soldeCDF = data.debitCDF - data.creditCDF;
      balanceRows.push({
        CompteOHADA: compte,
        IntituleCompte: data.label,
        TotalDebitUSD: Math.round(data.debitUSD * 100) / 100,
        TotalCreditUSD: Math.round(data.creditUSD * 100) / 100,
        SoldeDebiteurUSD: soldeUSD > 0 ? Math.round(soldeUSD * 100) / 100 : 0,
        SoldeCrediteurUSD: soldeUSD < 0 ? Math.round(Math.abs(soldeUSD) * 100) / 100 : 0,
        TotalDebitCDF: Math.round(data.debitCDF),
        TotalCreditCDF: Math.round(data.creditCDF),
        SoldeDebiteurCDF: soldeCDF > 0 ? Math.round(soldeCDF) : 0,
        SoldeCrediteurCDF: soldeCDF < 0 ? Math.round(Math.abs(soldeCDF)) : 0,
      });
    });

  // Generate Excel file with 3 tabs
  const filename = `Journal_Comptable_SYSCOHADA_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${currentDate}.xlsx`;
  exportToExcel(filename, [
    { sheetName: '1_Journal_Ventes_OHADA', data: salesJournalRows },
    { sheetName: '2_Journal_Tresorerie_Caisse', data: treasuryJournalRows },
    { sheetName: '3_Balance_Comptes_SYSCOHADA', data: balanceRows },
  ]);
}
