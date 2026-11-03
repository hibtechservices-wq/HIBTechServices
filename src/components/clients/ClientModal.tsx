import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientType } from '../../types';
import { User, Building, Phone, Mail, MapPin, X, Check } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, clientToEdit }) => {
  const { addClient, updateClient } = useApp();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [type, setType] = useState<ClientType>('INDIVIDUAL');
  const [phone, setPhone] = useState('+243 ');
  const [whatsapp, setWhatsapp] = useState('+243 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [commune, setCommune] = useState('');
  const [rccmOrNif, setRccmOrNif] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setCompanyName(clientToEdit.companyName || '');
      setType(clientToEdit.type);
      setPhone(clientToEdit.phone);
      setWhatsapp(clientToEdit.whatsapp || clientToEdit.phone);
      setEmail(clientToEdit.email || '');
      setAddress(clientToEdit.address || '');
      setCity(clientToEdit.city || '');
      setCommune(clientToEdit.commune || '');
      setRccmOrNif(clientToEdit.rccmOrNif || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setCompanyName('');
      setType('INDIVIDUAL');
      setPhone('+243 ');
      setWhatsapp('+243 ');
      setEmail('');
      setAddress('');
      setCity('Lubumbashi');
      setCommune('');
      setRccmOrNif('');
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        name,
        companyName: companyName.trim() || undefined,
        type,
        phone,
        whatsapp: whatsapp.trim() || phone,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city,
        commune: commune.trim() || undefined,
        rccmOrNif: rccmOrNif.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addClient({
        name,
        companyName: companyName.trim() || undefined,
        type,
        phone,
        whatsapp: whatsapp.trim() || phone,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city,
        commune: commune.trim() || undefined,
        rccmOrNif: rccmOrNif.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  const kinshasaCommunes = [
    'Gombe',
    'Limete',
    'Ngaliema',
    'Bandalungwa',
    'Lingwala',
    'Kalamu',
    'Kasa-Vubu',
    'Barumbu',
    'Kintambo',
    'Mont-Ngafula',
    'Lemba',
    'Matete',
    'Ndjili',
    'Masina',
    'Kimbanseke',
    'Nsele',
    'Maluku',
    'Autre Commune',
  ];

  const lubumbashiCommunes = [
    'Lubumbashi',
    'Kampemba',
    'Kamalondo',
    'Kenya',
    'Katuba',
    'Ruashi',
    'Annexe',
    'Autre Commune',
  ];

  const congoleseCities = [
    'Lubumbashi',
    'Kolwezi',
    'Likasi',
    'Goma',
    'Bukavu',
    'Kinshasa',
    'Matadi',
    'Kisangani',
    'Mbuji-Mayi',
    'Kananga',
    'Boma',
    'Kindu',
    'Autre Ville',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 text-amber-400 flex items-center justify-center font-bold">
              {type === 'COMPANY' ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">
                {clientToEdit ? 'Modifier la Fiche Client' : 'Ajouter un Nouveau Client'}
              </h3>
              <p className="text-xs text-neutral-500">
                Enregistrement dans le CRM et suivi des règlements / créances
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Client Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Type de Client
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('INDIVIDUAL')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  type === 'INDIVIDUAL'
                    ? 'border-amber-600 bg-amber-50 text-neutral-900 font-semibold ring-1 ring-amber-600'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <User className="w-4 h-4 text-amber-600" />
                <span>Particulier / Client Direct</span>
              </button>
              <button
                type="button"
                onClick={() => setType('COMPANY')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  type === 'COMPANY'
                    ? 'border-amber-600 bg-amber-50 text-neutral-900 font-semibold ring-1 ring-amber-600'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Building className="w-4 h-4 text-amber-600" />
                <span>Entreprise / Société / Cabinet</span>
              </button>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                {type === 'COMPANY' ? 'Nom du Contact / Responsable *' : 'Nom & Prénom du Client *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Patrick Mukendi ou Moïse Tshisekedi"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                required
              />
            </div>

            {type === 'COMPANY' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Raison Sociale / Nom Entreprise
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Société Minière du Katanga SARL"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Phones & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Téléphone Principal (RDC) *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 81 234 5678"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white font-mono-nums"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Numéro WhatsApp (Pour relances & reçus)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+243 81 234 5678"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white font-mono-nums"
              />
            </div>
          </div>

          {/* Email & RCCM/NIF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Adresse Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@entreprise.cd"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                RCCM ou NIF (Si entreprise)
              </label>
              <input
                type="text"
                value={rccmOrNif}
                onChange={(e) => setRccmOrNif(e.target.value)}
                placeholder="Ex: RCCM/KIN/19-B-012"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white font-mono-nums"
              />
            </div>
          </div>

          {/* City, Commune & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Ville
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
              >
                {congoleseCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Commune / Quartier
              </label>
              {city === 'Lubumbashi' ? (
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
                >
                  {lubumbashiCommunes.map((comm) => (
                    <option key={comm} value={comm}>
                      {comm}
                    </option>
                  ))}
                </select>
              ) : city === 'Kinshasa' ? (
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
                >
                  {kinshasaCommunes.map((comm) => (
                    <option key={comm} value={comm}>
                      {comm}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Quartier / Commune"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Adresse & Repères
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Justice n° 45"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Historique / Notes internes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Préfère être livré le matin, paie par M-Pesa..."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:bg-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>{clientToEdit ? 'Mettre à jour' : 'Enregistrer le Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
