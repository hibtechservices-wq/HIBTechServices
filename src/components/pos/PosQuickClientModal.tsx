import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserPlus, X, Check } from 'lucide-react';

interface PosQuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (clientId: string) => void;
}

export const PosQuickClientModal: React.FC<PosQuickClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const { addClient } = useApp();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [nif, setNif] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = addClient({
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      phone: phone.trim() || '+243 00 000 0000',
      nif: nif.trim() || undefined,
      address: address.trim() || undefined,
      city: 'Lubumbashi',
      type: companyName.trim() ? 'COMPANY' : 'INDIVIDUAL',
    });

    onClientCreated(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-200 overflow-hidden my-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Nouveau Client Express (Caisse)</h3>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Nom du Client / Responsable *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: M. Patrice Mwamba"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Raison Sociale / Entreprise (facultatif)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Entreprise Beltexco SARL"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Téléphone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 81 000 0000"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Numéro NIF (Impôt)
              </label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                placeholder="A2109845B"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 font-mono-nums"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Adresse / Ville
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Av. Kasa-Vubu"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold rounded-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Enregistrer & Assigner</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
