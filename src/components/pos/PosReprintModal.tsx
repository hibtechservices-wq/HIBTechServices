import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, AppUser } from '../../types';
import { formatDateTime, formatDualCurrency, getPaymentMethodLabel, getStatusBadge } from '../../utils/formatters';
import {
  Printer,
  X,
  Search,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Receipt,
  User,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PosReprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PosReprintModal: React.FC<PosReprintModalProps> = ({ isOpen, onClose }) => {
  const {
    sales,
    users,
    currentUser,
    settings,
    setActivePrintSale,
    recordAuditLog,
  } = useApp();

  const rate = settings.exchangeRateUSD_CDF || 2850;

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'TODAY' | 'ALL'>('TODAY');

  // Authorization challenge state
  const [selectedSaleToReprint, setSelectedSaleToReprint] = useState<Sale | null>(null);
  const [authorizerUserId, setAuthorizerUserId] = useState<string>('');
  const [reprintPassword, setReprintPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Eligible authorizing users (Super admin, manager, accountant, or anyone with canReprintInvoices / reprintPassword)
  const eligibleAuthorizers = useMemo(() => {
    return users.filter(
      (u) =>
        u.isActive &&
        (u.role === 'SUPER_ADMIN' ||
          u.role === 'MANAGER' ||
          u.permissions?.canReprintInvoices ||
          Boolean(u.reprintPassword))
    );
  }, [users]);

  // Today start date ISO
  const todayStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }, []);

  // Filtered sales eligible for reprint (receipts and invoices)
  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        // Exclude proforma drafts if they are not confirmed sales
        if (s.type === 'QUOTE_PROFORMA') return false;

        if (filterPeriod === 'TODAY' && s.createdAt < todayStart) {
          return false;
        }

        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase().trim();
        return (
          s.saleNumber.toLowerCase().includes(q) ||
          (s.dgiNfu && s.dgiNfu.toLowerCase().includes(q)) ||
          s.clientName.toLowerCase().includes(q) ||
          (s.clientPhone && s.clientPhone.includes(q)) ||
          (s.cashierName && s.cashierName.toLowerCase().includes(q)) ||
          s.items.some((it) => it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, filterPeriod, searchQuery, todayStart]);

  if (!isOpen) return null;

  const handleStartReprint = (sale: Sale) => {
    setSelectedSaleToReprint(sale);
    setReprintPassword('');
    setAuthError('');
    // Auto-select current user if eligible, or first eligible authorizer
    const isCurrentEligible = eligibleAuthorizers.some((u) => u.id === currentUser.id);
    if (isCurrentEligible) {
      setAuthorizerUserId(currentUser.id);
    } else if (eligibleAuthorizers.length > 0) {
      setAuthorizerUserId(eligibleAuthorizers[0].id);
    }
  };

  const handleCancelChallenge = () => {
    setSelectedSaleToReprint(null);
    setReprintPassword('');
    setAuthError('');
  };

  const handleValidatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleToReprint) return;

    setAuthError('');
    setIsVerifying(true);

    const entered = reprintPassword.trim();
    if (!entered) {
      setAuthError('Veuillez saisir le mot de passe de réimpression.');
      setIsVerifying(false);
      return;
    }

    // Identify authorizer: check selected authorizer or any active eligible user whose reprintPassword/pinCode matches
    let verifiedAuthorizer: AppUser | undefined;

    if (authorizerUserId) {
      const targetUser = users.find((u) => u.id === authorizerUserId);
      if (targetUser) {
        // Check reprintPassword or fallback to pinCode if no specific reprintPassword
        const expected = targetUser.reprintPassword || targetUser.pinCode;
        if (expected && expected === entered) {
          verifiedAuthorizer = targetUser;
        }
      }
    }

    // Fallback: check if the password matches ANY eligible supervisor/admin
    if (!verifiedAuthorizer) {
      verifiedAuthorizer = eligibleAuthorizers.find(
        (u) => (u.reprintPassword && u.reprintPassword === entered) || (u.pinCode === entered && (u.role === 'SUPER_ADMIN' || u.role === 'MANAGER'))
      );
    }

    if (!verifiedAuthorizer) {
      setAuthError('Mot de passe de réimpression incorrect. Vérifiez le mot de passe défini dans « Utilisateurs & Droits ».');
      setIsVerifying(false);
      return;
    }

    // Success: log audit trail
    recordAuditLog({
      action: 'INVOICE_REPRINT',
      title: `Réimpression autorisée : Facture N° ${selectedSaleToReprint.saleNumber}`,
      details: `Réimpression de la facture N° ${selectedSaleToReprint.saleNumber} (${selectedSaleToReprint.clientName} - $${selectedSaleToReprint.totalUSD} USD) autorisée par ${verifiedAuthorizer.name} (${verifiedAuthorizer.role}).`,
      severity: 'WARNING',
    });

    setIsVerifying(false);
    const saleToPrint = selectedSaleToReprint;

    // Reset and close reprint picker
    setSelectedSaleToReprint(null);
    setReprintPassword('');
    onClose();

    // Trigger printing of the invoice
    setTimeout(() => {
      setActivePrintSale(saleToPrint);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Printer className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Réimpression Facture / Ticket POS</span>
                <span className="text-[10px] bg-amber-400 text-neutral-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Accès Protégé
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Sélectionnez la facture à réimprimer. Le mot de passe superviseur sera exigé.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: SELECT INVOICE (if no invoice currently chosen) */}
          {!selectedSaleToReprint ? (
            <>
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par N° ticket (REC-...), NFU DGI, client ou article..."
                    className="w-full pl-9 pr-4 py-2 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 shrink-0 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterPeriod('TODAY')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filterPeriod === 'TODAY'
                        ? 'bg-neutral-900 text-white shadow-2xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Aujourd'hui ({sales.filter((s) => s.type !== 'QUOTE_PROFORMA' && s.createdAt >= todayStart).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPeriod('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      filterPeriod === 'ALL'
                        ? 'bg-neutral-900 text-white shadow-2xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Toutes ({sales.filter((s) => s.type !== 'QUOTE_PROFORMA').length})
                  </button>
                </div>
              </div>

              {/* Informational notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Contrôle de Sécurité & Traçabilité DGI :</strong> Toute réimpression à la caisse nécessite la saisie du <strong>mot de passe de réimpression</strong> d'un utilisateur habilité (enregistré dans <em>Utilisateurs & Droits</em>) et est consignée dans le journal d'audit.
                </div>
              </div>

              {/* Sales List Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                {filteredSales.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 space-y-2">
                    <Receipt className="w-8 h-8 mx-auto text-neutral-300 stroke-1" />
                    <p className="font-semibold text-neutral-600">Aucune facture trouvée pour ces critères.</p>
                    <p className="text-[11px] text-neutral-400">
                      Vérifiez le numéro saisi ou basculez sur "Toutes les factures".
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-neutral-50 text-neutral-700 uppercase font-bold text-[10px] border-b border-neutral-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">N° Ticket / NFU DGI</th>
                          <th className="py-2.5 px-3">Date & Heure</th>
                          <th className="py-2.5 px-3">Client</th>
                          <th className="py-2.5 px-3">Articles</th>
                          <th className="py-2.5 px-3 text-right">Montant</th>
                          <th className="py-2.5 px-3 text-center">Règlement</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filteredSales.map((sale) => {
                          const paymentInfo = getPaymentMethodLabel(sale.paymentMethod);
                          const totalItemsCount = sale.items.reduce((s, it) => s + it.quantity, 0);

                          return (
                            <tr key={sale.id} className="hover:bg-amber-50/40 transition-colors">
                              {/* Ticket N° */}
                              <td className="py-3 px-3">
                                <span className="font-mono font-bold text-neutral-900 block">
                                  {sale.saleNumber}
                                </span>
                                {sale.dgiNfu && (
                                  <span className="text-[9px] font-mono text-emerald-700 block truncate max-w-[130px]" title={sale.dgiNfu}>
                                    NFU: {sale.dgiNfu.slice(0, 14)}...
                                  </span>
                                )}
                              </td>

                              {/* Date */}
                              <td className="py-3 px-3 text-neutral-600 font-sans whitespace-nowrap">
                                <span className="block font-medium text-[11px] text-neutral-800">
                                  {formatDateTime(sale.createdAt).split(' ')[0]}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  {formatDateTime(sale.createdAt).split(' ')[1] || ''}
                                </span>
                              </td>

                              {/* Client */}
                              <td className="py-3 px-3 font-medium text-neutral-900 max-w-[140px] truncate" title={sale.clientName}>
                                {sale.clientName}
                              </td>

                              {/* Items summary */}
                              <td className="py-3 px-3 text-[11px] text-neutral-600 max-w-[150px] truncate" title={sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                <span className="font-bold text-neutral-800">{totalItemsCount} art.</span> : {sale.items[0]?.name || ''}
                                {sale.items.length > 1 && ` +${sale.items.length - 1}`}
                              </td>

                              {/* Amount */}
                              <td className="py-3 px-3 text-right font-mono-nums whitespace-nowrap">
                                <span className="font-black text-neutral-900 block text-xs">
                                  ${sale.totalUSD.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono block">
                                  {formatDualCurrency(sale.totalUSD, rate).cdf}
                                </span>
                              </td>

                              {/* Payment Method */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  {paymentInfo.label}
                                </span>
                              </td>

                              {/* Action */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleStartReprint(sale)}
                                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                                  title="Demander la réimpression avec mot de passe superviseur"
                                >
                                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Réimprimer</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* STEP 2: PASSWORD AUTHORIZATION CHALLENGE */
            <div className="space-y-4 animate-in zoom-in-95 duration-150 max-w-lg mx-auto py-2">
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <Lock className="w-5 h-5 text-neutral-950" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-950">
                    Autorisation Superviseur Requise
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Saisissez le <strong>mot de passe de réimpression</strong> d'un utilisateur habilité pour débloquer l'impression du ticket.
                  </p>
                </div>
              </div>

              {/* Selected Sale Recap Box */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Facture à réimprimer :</span>
                  <span className="font-mono font-black text-neutral-900 text-sm">{selectedSaleToReprint.saleNumber}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span>Client : <strong>{selectedSaleToReprint.clientName}</strong></span>
                  <span className="font-mono-nums font-bold text-emerald-700">
                    ${selectedSaleToReprint.totalUSD.toFixed(2)} USD ({formatDualCurrency(selectedSaleToReprint.totalUSD, rate).cdf})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                  <span>Émise le : {formatDateTime(selectedSaleToReprint.createdAt)}</span>
                  <span>Par : {selectedSaleToReprint.cashierName || 'Caisse'}</span>
                </div>
              </div>

              {/* Password Challenge Form */}
              <form onSubmit={handleValidatePassword} className="space-y-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
                {/* Authorizer selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Utilisateur / Superviseur qui autorise :
                  </label>
                  <select
                    value={authorizerUserId}
                    onChange={(e) => setAuthorizerUserId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 shadow-2xs"
                  >
                    {eligibleAuthorizers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'SUPER_ADMIN' ? 'Gérant / Direction' : u.role === 'MANAGER' ? 'Superviseur' : 'Responsable'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Mot de passe de Réimpression POS * :
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={reprintPassword}
                      onChange={(e) => setReprintPassword(e.target.value)}
                      placeholder="Saisissez le mot de passe de réimpression"
                      autoFocus
                      className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 focus:bg-white border-2 border-neutral-300 focus:border-amber-500 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400 placeholder:font-sans placeholder:font-normal"
                    />
                    <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
                      title={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Mot de passe configuré dans l'onglet <strong>Utilisateurs & Droits</strong> pour ce profil.
                  </span>
                </div>

                {/* Error message */}
                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2 text-xs font-medium animate-in shake">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Challenge Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={handleCancelChallenge}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs transition-colors"
                  >
                    Retour
                  </button>

                  <button
                    type="submit"
                    disabled={isVerifying || !reprintPassword.trim()}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs ${
                      reprintPassword.trim()
                        ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 cursor-pointer active:scale-95 shadow-amber-400/10'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <Unlock className="w-4 h-4 text-amber-400" />
                    <span>Autoriser & Imprimer le Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
