import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trash2,
  AlertTriangle,
  X,
  Download,
  CheckCircle2,
  ShieldAlert,
  Database,
  Receipt,
  Users,
  Package,
  Radio,
  CreditCard,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface DataWipeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DataWipeModal: React.FC<DataWipeModalProps> = ({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
}) => {
  const {
    isDataWipeModalOpen,
    setIsDataWipeModalOpen,
    wipeData,
    exportDatabaseJSON,
    resetToDemoData,
    sales,
    clients,
    products,
    expenses,
    cashSessions,
    equipments,
    auditLogs,
  } = useApp();

  const isModalOpen = propsIsOpen !== undefined ? propsIsOpen : isDataWipeModalOpen;
  const handleClose = () => {
    if (propsOnClose) {
      propsOnClose();
    } else {
      setIsDataWipeModalOpen(false);
    }
  };

  const [wipeMode, setWipeMode] = useState<'TRANSACTIONS' | 'SELECTIVE' | 'ALL' | 'DEMO'>('TRANSACTIONS');
  const [selectedModules, setSelectedModules] = useState<{
    sales: boolean;
    cashSessions: boolean;
    expenses: boolean;
    clients: boolean;
    products: boolean;
    equipments: boolean;
    auditLogs: boolean;
  }>({
    sales: true,
    cashSessions: true,
    expenses: true,
    clients: false,
    products: false,
    equipments: false,
    auditLogs: false,
  });

  const [confirmationWord, setConfirmationWord] = useState('');
  const [hasExportedBackup, setHasExportedBackup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isModalOpen) return null;

  const handleBackupClick = () => {
    exportDatabaseJSON();
    setHasExportedBackup(true);
  };

  const handleExecuteWipe = () => {
    if (confirmationWord.trim().toUpperCase() !== 'SUPPRIMER') {
      return;
    }

    if (wipeMode === 'DEMO') {
      resetToDemoData();
      setSuccessMessage('Les données de démonstration officielles RDC (Normes DGI DEF) ont été rechargées avec succès.');
    } else if (wipeMode === 'TRANSACTIONS') {
      wipeData({
        sales: true,
        cashSessions: true,
        expenses: true,
      });
      setSuccessMessage('Toutes les transactions, factures, devis et sessions de caisse ont été purgées avec succès. Vos articles et clients restent conservés.');
    } else if (wipeMode === 'ALL') {
      wipeData({
        resetAll: true,
      });
      setSuccessMessage('La base de données a été totalement remise à zéro. L\'application est désormais vierge pour votre nouvelle entreprise.');
    } else {
      wipeData({
        sales: selectedModules.sales,
        cashSessions: selectedModules.cashSessions,
        expenses: selectedModules.expenses,
        clients: selectedModules.clients,
        products: selectedModules.products,
        equipments: selectedModules.equipments,
        auditLogs: selectedModules.auditLogs,
      });
      setSuccessMessage('Les modules sélectionnés ont été supprimés définitivement avec succès.');
    }

    setTimeout(() => {
      setSuccessMessage('');
      setConfirmationWord('');
      handleClose();
    }, 1800);
  };

  const isConfirmationValid = confirmationWord.trim().toUpperCase() === 'SUPPRIMER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-rose-900 to-neutral-900 text-white flex items-center justify-between border-b border-rose-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-400/30">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Suppression des Données de l'Application</span>
                <span className="text-[10px] bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Zone Danger
                </span>
              </h3>
              <p className="text-xs text-rose-200 mt-0.5">
                Purge des données de test ou remise à zéro pour démarrer la production
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-300 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {successMessage ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">Opération effectuée avec succès</h4>
              <p className="text-xs text-emerald-700">{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Current Data Overview */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-bold text-[11px] text-neutral-700 uppercase tracking-wider block mb-2">
                  État actuel de la base de données :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-neutral-200">
                    <span className="block text-base font-black text-neutral-900">{sales.length}</span>
                    <span className="text-[10px] text-neutral-500">Ventes/Factures</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-neutral-200">
                    <span className="block text-base font-black text-neutral-900">{products.length}</span>
                    <span className="text-[10px] text-neutral-500">Articles Stock</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-neutral-200">
                    <span className="block text-base font-black text-neutral-900">{clients.length}</span>
                    <span className="text-[10px] text-neutral-500">Clients</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-neutral-200">
                    <span className="block text-base font-black text-neutral-900">{expenses.length}</span>
                    <span className="text-[10px] text-neutral-500">Dépenses</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Mandatory Backup recommendation */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900">1. Sauvegarde de sécurité recommandée</h4>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Avant toute suppression, téléchargez une copie intégrale de vos données actuelles au format JSON.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBackupClick}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-2xs ${
                    hasExportedBackup
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{hasExportedBackup ? 'Sauvegardé ✓' : 'Sauvegarder JSON'}</span>
                </button>
              </div>

              {/* Step 2: Choose wipe scope */}
              <div className="space-y-2">
                <label className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] block">
                  2. Choisissez le type d'opération de suppression :
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option 1: Transactions Only */}
                  <button
                    type="button"
                    onClick={() => setWipeMode('TRANSACTIONS')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      wipeMode === 'TRANSACTIONS'
                        ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-neutral-900 block flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-rose-600" />
                        Purger les Transactions Seules
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        Supprime toutes les ventes, factures et sessions de caisse. <strong>Conserve</strong> le catalogue d'articles et la liste des clients.
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded mt-2 inline-block w-fit">
                      Idéal après tests
                    </span>
                  </button>

                  {/* Option 2: Selective */}
                  <button
                    type="button"
                    onClick={() => setWipeMode('SELECTIVE')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      wipeMode === 'SELECTIVE'
                        ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-neutral-900 block flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        Sélection Personnalisée
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        Cochez module par module exactement ce que vous voulez effacer.
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded mt-2 inline-block w-fit">
                      Au choix
                    </span>
                  </button>

                  {/* Option 3: Reset All */}
                  <button
                    type="button"
                    onClick={() => setWipeMode('ALL')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      wipeMode === 'ALL'
                        ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-500'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-neutral-900 block flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                        Remise à Zéro Totale (Reset Usine)
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        Efface tout (ventes, clients, stocks, dépenses). L'application devient totalement vierge.
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded mt-2 inline-block w-fit">
                      Effacement intégral
                    </span>
                  </button>

                  {/* Option 4: Reload Demo Data */}
                  <button
                    type="button"
                    onClick={() => setWipeMode('DEMO')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      wipeMode === 'DEMO'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-neutral-900 block flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        Recharger les Données Démo DGI RDC
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        Rétablit les articles de démo (Starlink, routeurs, clients Lubumbashi, factures certifiées).
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded mt-2 inline-block w-fit">
                      Démo DGI RDC
                    </span>
                  </button>
                </div>
              </div>

              {/* Selective checkboxes (if SELECTIVE mode is active) */}
              {wipeMode === 'SELECTIVE' && (
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <span className="font-semibold text-neutral-700 text-[11px] block">
                    Cochez les éléments à supprimer définitivement :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.sales}
                        onChange={(e) => setSelectedModules({ ...selectedModules, sales: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <Receipt className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-medium text-neutral-800">Ventes & Factures ({sales.length})</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.cashSessions}
                        onChange={(e) => setSelectedModules({ ...selectedModules, cashSessions: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium text-neutral-800">Sessions de Caisse ({cashSessions.length})</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.expenses}
                        onChange={(e) => setSelectedModules({ ...selectedModules, expenses: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <CreditCard className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-medium text-neutral-800">Dépenses & Charges ({expenses.length})</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.clients}
                        onChange={(e) => setSelectedModules({ ...selectedModules, clients: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-medium text-neutral-800">Répertoire Clients ({clients.length})</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.products}
                        onChange={(e) => setSelectedModules({ ...selectedModules, products: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-neutral-800">Catalogue & Stocks ({products.length})</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.equipments}
                        onChange={(e) => setSelectedModules({ ...selectedModules, equipments: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <Radio className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-medium text-neutral-800">Parc Équipements ({equipments.length})</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.auditLogs}
                        onChange={(e) => setSelectedModules({ ...selectedModules, auditLogs: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <ShieldAlert className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      <span className="font-medium text-neutral-800">Journal d'Audit ({auditLogs.length})</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Warning Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Attention :</strong> Cette opération est <strong>irréversible</strong>. Les données effacées ne pourront plus être récupérées à moins d'avoir téléchargé une sauvegarde JSON au préalable.
                </div>
              </div>

              {/* Step 3: Security confirmation input */}
              <div className="space-y-1.5 pt-1 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 text-[11px] block">
                    3. Pour confirmer l'opération, tapez <span className="text-rose-600 font-mono font-black">SUPPRIMER</span> ci-dessous :
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfirmationWord('SUPPRIMER')}
                    className="text-[10px] text-rose-700 hover:text-rose-800 font-semibold underline underline-offset-2"
                  >
                    Remplir automatiquement
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={confirmationWord}
                    onChange={(e) => setConfirmationWord(e.target.value)}
                    placeholder="Tapez SUPPRIMER"
                    className="flex-1 px-3.5 py-2.5 bg-neutral-50 focus:bg-white border-2 border-neutral-300 focus:border-rose-600 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400"
                  />
                  {isConfirmationValid && (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold text-xs shrink-0 px-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valide</span>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!successMessage && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-xl font-bold text-xs transition-colors"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={!isConfirmationValid}
              onClick={handleExecuteWipe}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                isConfirmationValid
                  ? wipeMode === 'DEMO'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95 shadow-blue-600/20 shadow-md'
                    : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95 shadow-rose-600/20 shadow-md'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
              }`}
            >
              {wipeMode === 'DEMO' ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirmer le rechargement Démo RDC</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmer la suppression définitive</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
