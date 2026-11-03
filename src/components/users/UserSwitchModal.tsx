import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getRoleBadgeInfo } from '../../data/initialUsers';
import { User, Lock, X, Check, KeyRound, ShieldAlert, LogOut } from 'lucide-react';

export const UserSwitchModal: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    switchUserByPin,
    isUserSwitchModalOpen,
    setIsUserSwitchModalOpen,
    logout,
  } = useApp();

  const [enteredPin, setEnteredPin] = useState('');
  const [selectedUserForPin, setSelectedUserForPin] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isUserSwitchModalOpen) return null;

  const handleQuickSwitch = (u: any) => {
    setSelectedUserForPin(u.id);
    setEnteredPin('');
    setErrorMessage('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = switchUserByPin(enteredPin, selectedUserForPin || undefined);
    if (res.success) {
      setIsUserSwitchModalOpen(false);
      setEnteredPin('');
      setSelectedUserForPin(null);
    } else {
      setErrorMessage(res.message || 'Code PIN incorrect.');
      setEnteredPin('');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      if (nextPin.length === 4) {
        // Auto submit on 4 digits
        const res = switchUserByPin(nextPin, selectedUserForPin || undefined);
        if (res.success) {
          setIsUserSwitchModalOpen(false);
          setEnteredPin('');
          setSelectedUserForPin(null);
        } else {
          setErrorMessage(res.message || 'Code PIN incorrect.');
          setEnteredPin('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Changer d'Utilisateur / Session</h3>
              <p className="text-[11px] text-neutral-400">
                Session actuelle : <span className="text-amber-400 font-semibold">{currentUser.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsUserSwitchModalOpen(false);
              setSelectedUserForPin(null);
              setErrorMessage('');
            }}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-neutral-600 text-center">
            Sélectionnez votre profil ou composez votre <strong>Code PIN à 4 chiffres</strong> pour déverrouiller votre session de travail.
          </p>

          {/* User profiles quick select */}
          <div className="grid grid-cols-2 gap-2">
            {users.filter(u => u.isActive).map((u) => {
              const roleInfo = getRoleBadgeInfo(u.role);
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSwitch(u)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-bold text-xs text-neutral-900 block truncate">
                      {u.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-neutral-500 block truncate">
                      {roleInfo.label.split('/')[0]}
                    </span>
                  </div>
                  <span className="text-[9px] text-neutral-500 mt-2 flex items-center gap-1 font-medium">
                    <Lock className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                    <span>Code PIN requis</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* PIN Input & Keypad */}
          <form onSubmit={handlePinSubmit} className="pt-2 border-t border-neutral-100 space-y-3">
            <div className="text-center">
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Saisir le Code PIN (4 Chiffres)
              </label>
              
              <div className="flex justify-center gap-2 mb-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center font-mono-nums text-lg font-bold transition-all ${
                      enteredPin.length > idx
                        ? 'border-neutral-900 bg-neutral-900 text-amber-400'
                        : 'border-neutral-300 bg-neutral-50 text-neutral-400'
                    }`}
                  >
                    {enteredPin.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
              )}
            </div>

            {/* Numeric Keypad for fast touchscreen POS cashier shifts */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') setEnteredPin('');
                    else if (k === 'OK') {
                      if (enteredPin.length >= 4) {
                        const res = switchUserByPin(enteredPin);
                        if (res.success) {
                          setIsUserSwitchModalOpen(false);
                          setEnteredPin('');
                        } else {
                          setErrorMessage(res.message || 'Code PIN incorrect.');
                        }
                      }
                    } else {
                      handlePinDigit(k);
                    }
                  }}
                  className={`py-3 rounded-xl font-bold font-mono-nums text-sm transition-colors ${
                    k === 'OK'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : k === 'C'
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-base'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Lock / Logout Session trigger */}
            <div className="pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setIsUserSwitchModalOpen(false);
                  logout();
                }}
                className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Verrouiller l'écran & Se déconnecter</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
