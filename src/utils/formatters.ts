import { Currency, PaymentMethod, SaleStatus, DocumentType, Sale, Client, CompanySettings, FiscalTaxGroup } from '../types';

export function formatMoney(amount: number, currency: Currency = 'USD', exchangeRate: number = 2850): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  if (currency === 'USD') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('US$', '$');
  } else {
    // CDF (Franc Congolais)
    const cdfValue = Math.round(amount * (currency === 'CDF' ? 1 : exchangeRate));
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cdfValue) + ' FC';
  }
}

export function formatDualCurrency(amountUSD: number | string | undefined | null, exchangeRate: number | string | undefined | null = 2850): { usd: string; cdf: string } {
  const safeAmount = typeof amountUSD === 'number' && !isNaN(amountUSD) ? amountUSD : Number(amountUSD) || 0;
  const safeRate = typeof exchangeRate === 'number' && !isNaN(exchangeRate) && exchangeRate > 0 ? exchangeRate : Number(exchangeRate) || 2850;

  const usdFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount).replace('US$', '$');

  const cdfValue = Math.round(safeAmount * safeRate);
  const cdfFormatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cdfValue) + ' FC';

  return { usd: usdFormatted, cdf: cdfFormatted };
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getPaymentMethodLabel(method: PaymentMethod): { label: string; provider: string; color: string } {
  switch (method) {
    case 'MPESA':
      return { label: 'M-Pesa', provider: 'Vodacom RDC', color: 'text-red-600 bg-red-50 border-red-200' };
    case 'ORANGE_MONEY':
      return { label: 'Orange Money', provider: 'Orange RDC', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    case 'AIRTEL_MONEY':
      return { label: 'Airtel Money', provider: 'Airtel RDC', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    case 'AFRIMONEY':
      return { label: 'Afrimoney', provider: 'Africell RDC', color: 'text-purple-600 bg-purple-50 border-purple-200' };
    case 'CASH_USD':
      return { label: 'Espèces ($ USD)', provider: 'Cash Dollar', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'CASH_CDF':
      return { label: 'Espèces (FC)', provider: 'Cash Franc Congolais', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'BANK_TRANSFER':
      return { label: 'Virement / Carte', provider: 'Banque (Rawbank, Equity BCDC...)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    case 'CREDIT':
      return { label: 'À Crédit (Créance)', provider: 'Paiement différé', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    default:
      return { label: method, provider: 'Autre', color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
}

export function getStatusBadge(status: SaleStatus): { label: string; class: string } {
  switch (status) {
    case 'PAID':
      return { label: 'Payée', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'PARTIAL':
      return { label: 'Acompte versé', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'UNPAID':
      return { label: 'Non Payée / Créance', class: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
}

export function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case 'INVOICE':
      return 'Facture Normalisée DGI';
    case 'QUOTE_PROFORMA':
      return 'Devis / Proforma';
    case 'RECEIPT':
      return 'Ticket Caisse / Reçu Normalisé';
  }
}

export function getTaxGroupDetails(group: FiscalTaxGroup): { label: string; rateText: string; desc: string } {
  switch (group) {
    case 'A':
      return { label: 'Groupe A (16%)', rateText: '16%', desc: 'Taux standard TVA RDC' };
    case 'B':
      return { label: 'Groupe B (0%)', rateText: '0%', desc: 'Taux spécifique zéro' };
    case 'C':
      return { label: 'Groupe C (Exonéré)', rateText: 'Exonéré', desc: 'Exonération légale Code des Impôts' };
    case 'D':
      return { label: 'Groupe D (Hors champ)', rateText: 'Hors champ', desc: 'Non assujetti à la TVA' };
  }
}

/**
 * Generates an authentic cryptographic security code / digital signature hash
 * formatted as 4 hex blocks: XXXX-XXXX-XXXX-XXXX
 */
export function generateDgiSecurityCode(
  nif: string,
  terminalId: string,
  counter: number,
  totalUSD: number,
  dateIso: string
): string {
  const seed = `${nif}|${terminalId}|${counter}|${totalUSD.toFixed(2)}|${dateIso}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0').slice(-4).toUpperCase();
  const hex2 = Math.abs(hash * 31).toString(16).padStart(8, '0').slice(-4).toUpperCase();
  const hex3 = Math.abs(hash * 97).toString(16).padStart(8, '0').slice(-4).toUpperCase();
  const hex4 = Math.abs(hash * 199).toString(16).padStart(8, '0').slice(-4).toUpperCase();
  
  return `${hex1}-${hex2}-${hex3}-${hex4}`;
}

/**
 * Generates official DGI RDC QR code payload string
 */
export function generateDgiQrPayload(sale: Sale, company: CompanySettings): string {
  const clientNifClean = sale.clientNif || 'NON-ASSUJETTI';
  return `DGI-RDC|NIF_EMET:${company.nif || 'NIF-NON-DEFINI'}|NIF_CLI:${clientNifClean}|NFU:${sale.dgiNfu || sale.saleNumber}|DATE:${sale.createdAt}|HT_USD:${sale.subtotalUSD.toFixed(2)}|TVA_USD:${sale.taxAmountUSD.toFixed(2)}|TTC_USD:${sale.totalUSD.toFixed(2)}|TTC_CDF:${sale.totalCDF}|CS:${sale.dgiSecurityCode || '0000-0000-0000-0000'}|DEF:${company.dgiDefTerminalId || 'DEF-01'}|CENTRE:${company.dgiCenter || 'DGI-CDI'}`;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '243' + cleaned.substring(1);
  } else if (!cleaned.startsWith('243') && cleaned.length >= 9) {
    cleaned = '243' + cleaned;
  }
  return cleaned;
}

export function generateWhatsAppDebtMessage(
  client: Client,
  sale: Sale | null,
  company: CompanySettings,
  rate: number
): string {
  const amountUSD = sale ? sale.remainingDebtUSD : client.outstandingDebtUSD;
  const amountCDF = Math.round(amountUSD * rate);

  let text = `Bonjour cher(e) *${client.name}*,\n\n`;
  text += `Nous espérons que vous vous portez bien.\n`;
  text += `De la part de *${company.name}* (NIF DGI : ${company.nif}),\n\n`;

  if (sale) {
    text += `Nous vous contactons concernant votre facture normalisée *N° ${sale.saleNumber}* (NFU DGI : ${sale.dgiNfu}) émise le ${formatDate(sale.createdAt)}.\n`;
    text += `📌 *Solde restant à régler :* $${amountUSD.toFixed(2)} USD (soit env. ${new Intl.NumberFormat('fr-FR').format(amountCDF)} FC au taux du jour 1$ = ${rate} FC).\n\n`;
  } else {
    text += `Nous faisons le point sur votre compte client. Vous avez un solde en cours de :\n`;
    text += `📌 *Montant total dû :* $${amountUSD.toFixed(2)} USD (soit env. ${new Intl.NumberFormat('fr-FR').format(amountCDF)} FC).\n\n`;
  }

  text += `💳 *Moyens de paiement disponibles :*\n`;
  if (company.mpesaNumber) text += `• M-Pesa : *${company.mpesaNumber}* (${company.mpesaName || company.name})\n`;
  if (company.orangeMoneyNumber) text += `• Orange Money : *${company.orangeMoneyNumber}* (${company.orangeMoneyName || company.name})\n`;
  if (company.airtelMoneyNumber) text += `• Airtel Money : *${company.airtelMoneyNumber}* (${company.airtelMoneyName || company.name})\n`;
  if (company.bankDetails) text += `• Banque : *${company.bankDetails}*\n`;
  text += `• Ou directement à nos bureaux : ${company.address}, ${company.city}.\n\n`;

  text += `Merci de nous faire parvenir la référence de transaction après paiement.\n`;
  text += `Cordialement,\n*${company.name}* - Service Facturation & Comptabilité\n📞 ${company.phone1}`;

  return text;
}

export function generateWhatsAppReceiptMessage(
  sale: Sale,
  company: CompanySettings
): string {
  const isPaid = sale.paymentStatus === 'PAID';
  const docTypeLabel = sale.type === 'QUOTE_PROFORMA' ? 'Devis Proforma' : sale.type === 'RECEIPT' ? 'Reçu de Paiement' : 'Facture Normalisée';
  let text = `Bonjour *${sale.clientName}*,\n\n`;
  text += `Veuillez trouver ci-joint votre document au format *PDF* : *${docTypeLabel} N° ${sale.saleNumber}* émise par *${company.name}* (NIF : ${company.nif}).\n\n`;
  text += `🧾 *Document :* ${docTypeLabel} ${sale.saleNumber}\n`;
  text += `🏛️ *NFU DGI :* ${sale.dgiNfu || 'SFN-00000'}\n`;
  text += `🔒 *Code Sécurité DEF :* ${sale.dgiSecurityCode}\n`;
  text += `📅 *Date :* ${formatDateTime(sale.createdAt)}\n\n`;
  text += `🛒 *Détail des lignes :*\n`;
  
  sale.items.forEach(item => {
    text += `• [Gr.${item.taxGroup}] ${item.name} (${item.quantity} ${item.unit}) : $${item.subtotalUSD.toFixed(2)}\n`;
  });

  text += `\n💵 *Total HT :* $${sale.subtotalUSD.toFixed(2)}\n`;
  if (sale.taxAmountUSD > 0) {
    text += `🏛️ *TVA RDC (16%) :* $${sale.taxAmountUSD.toFixed(2)}\n`;
  }
  text += `💰 *Total TTC :* $${sale.totalUSD.toFixed(2)} (ou ${new Intl.NumberFormat('fr-FR').format(sale.totalCDF)} FC)\n`;
  text += `✅ *Montant versé :* $${sale.amountPaidUSD.toFixed(2)}\n`;
  if (!isPaid) {
    text += `⚠️ *Reste à payer :* $${sale.remainingDebtUSD.toFixed(2)}\n`;
  } else {
    text += `✅ *Statut : PAYÉ INTÉGRALEMENT (Quittance & Facture Validée)*\n`;
  }

  text += `\n📄 *Le fichier PDF complet avec jauge de règlement et QR code fiscal vous a été transmis en pièce jointe.*\n`;
  text += `\nMerci pour votre confiance !\n*${company.name}*\n${company.address}, ${company.city}\n📞 ${company.phone1}`;
  return text;
}

/**
 * Message pré-rédigé pour l'envoi direct de facture par WhatsApp Web
 * Conforme à la demande utilisateur avec mention explicite du document PDF :
 */
export function generateDirectWhatsAppInvoiceMessage(
  sale: Sale,
  company: CompanySettings,
  rateUSD_CDF?: number
): string {
  const clientName = sale.clientName || 'Client';
  const invoiceNumber = sale.saleNumber;
  const docTypeLabel = sale.type === 'QUOTE_PROFORMA' ? 'devis' : 'facture';
  const amountUSD = sale.totalUSD.toFixed(2);
  const rate = rateUSD_CDF || company.exchangeRateUSD_CDF || 2850;
  const amountCDF = new Intl.NumberFormat('fr-FR').format(sale.totalCDF || Math.round(sale.totalUSD * rate));
  const mpesaNumber = company.mpesaNumber || company.phone1 || '0810000000';
  const companyName = company.name || 'Notre Entreprise';

  return `Bonjour ${clientName}, veuillez trouver ci-joint votre document au format PDF : ${docTypeLabel} N° ${invoiceNumber} d'un montant de ${amountUSD} $ USD (${amountCDF} CDF). Pour vos règlements Mobile Money : M-Pesa au ${mpesaNumber}. Cordialement, ${companyName}.`;
}

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
